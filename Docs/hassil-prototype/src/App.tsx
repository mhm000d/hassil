import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import type { FormEvent } from 'react';
import { initialState } from './seed';
import type {
  AccountType,
  AdminDecision,
  AdvanceRequest,
  AppState,
  Client,
  ConfirmationStatus,
  Invoice,
  PageName,
  Transaction,
  User,
} from './types';
import {
  buildAiSnapshot,
  calculateQuote,
  clamp,
  createFingerprint,
  daysUntilDate,
  decideAdvance,
  formatCurrency,
  formatDate,
  formatDateTime,
  generateId,
  getModelLabel,
  getNextSimulationLabel,
  getReviewFlags,
  getRules,
  getStatusColor,
  getStatusLabel,
  getTrustScoreColor,
  getTrustScoreLabel,
  getUserDisplayName,
  scoreAdvance,
} from './utils';

type GoTo = (page: PageName, params?: Record<string, string>) => void;

type InvoiceFormPayload = {
  clientName: string;
  clientEmail: string;
  clientCountry: string;
  invoiceNumber: string;
  receivableSource: Invoice['receivableSource'];
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  description: string;
  paymentTerms: string;
};

const moneyMovementTypes = new Set(['AdvanceDisbursement', 'UserRepayment', 'ClientPaymentToHassil', 'BufferRelease']);

function App() {
  const [state, setState] = useState<AppState>(() => ({ ...initialState, ...parseRouteHash(window.location.hash) }));

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) || state.users[0],
    [state.currentUserId, state.users],
  );

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId('toast');
    setState((prev) => ({ ...prev, toasts: [...prev.toasts, { id, message, type }] }));
    window.setTimeout(() => {
      setState((prev) => ({ ...prev, toasts: prev.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  };

  useEffect(() => {
    const syncFromHash = () => {
      const route = parseRouteHash(window.location.hash);
      setState((prev) => ({ ...prev, currentPage: route.currentPage, pageParams: route.pageParams }));
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const go: GoTo = (page, params = {}) => {
    setState((prev) => ({ ...prev, currentPage: page, pageParams: params }));
    const hash = buildRouteHash(page, params);
    if (window.location.hash !== hash) window.location.hash = hash;
  };

  const resetDemo = () => {
    setState(initialState);
    window.location.hash = buildRouteHash(initialState.currentPage, initialState.pageParams);
  };

  const setCurrentUser = (userId: string) => {
    setState((prev) => ({ ...prev, currentUserId: userId, currentPage: 'dashboard', pageParams: {} }));
    window.location.hash = buildRouteHash('dashboard');
    showToast('Profile switched.', 'info');
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transaction: Transaction = { ...tx, id: generateId('tx'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, transactions: [transaction, ...prev.transactions] }));
  };

  const updateTrustScore = (userId: string, delta: number, reason: string) => {
    setState((prev) => {
      const user = prev.users.find((u) => u.id === userId);
      if (!user) return prev;
      const oldScore = user.trustScore;
      const newScore = clamp(oldScore + delta, 0, 100);
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, trustScore: newScore } : u)),
        trustScoreEvents: [
          { id: generateId('score'), userId, oldScore, newScore, reason, createdAt: new Date().toISOString() },
          ...prev.trustScoreEvents,
        ],
        transactions: [
          {
            id: generateId('tx-score'),
            userId,
            type: 'TrustScoreAdjustment',
            direction: 'Internal',
            amount: delta,
            description: reason,
            createdAt: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      };
    });
  };

  const createInvoice = (payload: InvoiceFormPayload) => {
    const fingerprint = createFingerprint(
      payload.invoiceNumber,
      payload.clientEmail,
      payload.amount,
      payload.dueDate,
      payload.receivableSource,
    );

    if (state.invoices.some((inv) => inv.fingerprint === fingerprint)) {
      showToast('This invoice already exists.', 'error');
      return;
    }

    const client: Client =
      state.clients.find((c) => c.email.toLowerCase() === payload.clientEmail.toLowerCase()) || {
        id: generateId('client'),
        name: payload.clientName,
        email: payload.clientEmail,
        country: payload.clientCountry,
      };

    const invoice: Invoice = {
      id: generateId('inv'),
      userId: currentUser.id,
      clientId: client.id,
      client,
      invoiceNumber: payload.invoiceNumber,
      receivableSource: payload.receivableSource,
      amount: payload.amount,
      currency: payload.currency,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      description: payload.description,
      paymentTerms: payload.paymentTerms,
      status: 'Submitted',
      fingerprint,
      createdAt: new Date().toISOString(),
      documents: [
        {
          id: generateId('doc'),
          invoiceId: 'temp',
          fileName: 'invoice-evidence.pdf',
          documentType: 'Supporting Evidence',
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
    invoice.documents = invoice.documents.map((doc) => ({ ...doc, invoiceId: invoice.id }));

    setState((prev) => ({
      ...prev,
      clients: prev.clients.some((c) => c.id === client.id) ? prev.clients : [...prev.clients, client],
      invoices: [invoice, ...prev.invoices],
      currentPage: 'invoiceDetail',
      pageParams: { invoiceId: invoice.id },
    }));
    window.location.hash = buildRouteHash('invoiceDetail', { invoiceId: invoice.id });
    showToast('Invoice created.');
  };

  const addDocumentPlaceholder = (invoiceId: string, documentType = 'Supporting Evidence', fileName = 'invoice-evidence.pdf') => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              documents: [
                ...invoice.documents,
                {
                  id: generateId('doc'),
                  invoiceId,
                  fileName,
                  documentType,
                  uploadedAt: new Date().toISOString(),
                },
              ],
            }
          : invoice,
      ),
    }));
    showToast('Evidence added.');
  };

  const createAdvanceRequest = (invoiceId: string, termsAccepted: boolean) => {
    const invoice = state.invoices.find((inv) => inv.id === invoiceId);
    const user = state.users.find((u) => u.id === invoice?.userId);
    if (!invoice || !user) return;
    if (!termsAccepted) {
      showToast('Accept the terms before submitting.', 'error');
      return;
    }
    if (state.advanceRequests.some((adv) => adv.invoiceId === invoiceId)) {
      showToast('This invoice already has an advance request.', 'error');
      return;
    }

    const quote = calculateQuote(user, invoice);
    const confirmation =
      quote.financingModel === 'InvoiceFactoring'
        ? {
            id: generateId('conf'),
            invoiceId,
            token: `confirm-${generateId('token')}`,
            clientEmail: invoice.client.email,
            status: 'Pending' as ConfirmationStatus,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : undefined;

    const invoiceWithConfirmation: Invoice = { ...invoice, clientConfirmation: confirmation };
    const score = scoreAdvance(user, invoiceWithConfirmation, quote.financingModel, termsAccepted, false);
    const decision = decideAdvance(user, invoiceWithConfirmation, score, quote.financingModel);
    const flags = getReviewFlags(user, invoiceWithConfirmation, score, quote.financingModel);
    const advanceId = generateId('adv');
    const advance: AdvanceRequest = {
      id: advanceId,
      invoiceId,
      userId: user.id,
      financingModel: quote.financingModel,
      repaymentParty: quote.repaymentParty,
      clientNotificationRequired: quote.clientNotificationRequired,
      requestedPercent: quote.requestedPercent,
      advanceAmount: quote.advanceAmount,
      feeRate: quote.feeRate,
      feeAmount: quote.feeAmount,
      settlementBufferAmount: quote.settlementBufferAmount,
      expectedRepaymentAmount: quote.expectedRepaymentAmount,
      reviewScore: score,
      approvalMode: decision === 'Approved' ? 'Auto' : decision === 'PendingReview' ? 'Manual' : undefined,
      status: decision,
      rejectionReason: decision === 'Rejected' ? 'Rule engine rejected this request.' : undefined,
      termsAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      advanceRequests: [advance, ...prev.advanceRequests],
      aiReviewSnapshots: [buildAiSnapshot(advanceId, score, flags), ...prev.aiReviewSnapshots],
      invoices: prev.invoices.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: decision === 'PendingClientConfirmation' ? 'PendingClientConfirmation' : decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'PendingReview',
              advanceRequestId: advanceId,
              clientConfirmation: confirmation,
            }
          : inv,
      ),
      currentPage: 'advanceDetail',
      pageParams: { advanceId },
    }));
    window.location.hash = buildRouteHash('advanceDetail', { advanceId });

    showToast(
      decision === 'PendingClientConfirmation'
        ? 'Request created. Client confirmation is next.'
        : decision === 'Approved'
          ? 'Request approved.'
          : decision === 'PendingReview'
            ? 'Request sent to review.'
            : 'Request rejected.',
      decision === 'Rejected' ? 'error' : 'success',
    );
  };

  const confirmClientInvoice = (token: string, status: ConfirmationStatus, note: string) => {
    const invoice = state.invoices.find((inv) => inv.clientConfirmation?.token === token);
    const advance = state.advanceRequests.find((adv) => adv.invoiceId === invoice?.id);
    const user = state.users.find((u) => u.id === invoice?.userId);
    if (!invoice || !advance || !user) return;

    const updatedInvoice: Invoice = {
      ...invoice,
      status: status === 'Confirmed' ? 'Confirmed' : 'Disputed',
      clientConfirmation: {
        ...invoice.clientConfirmation!,
        status,
        clientNote: note,
        respondedAt: new Date().toISOString(),
      },
    };

    const score = scoreAdvance(user, updatedInvoice, advance.financingModel, Boolean(advance.termsAcceptedAt), false);
    const decision = status === 'Disputed' ? 'Rejected' : decideAdvance(user, updatedInvoice, score, advance.financingModel);
    const flags = getReviewFlags(user, updatedInvoice, score, advance.financingModel);

    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) =>
        inv.id === invoice.id
          ? { ...updatedInvoice, status: decision === 'Approved' ? 'Approved' : decision === 'PendingReview' ? 'PendingReview' : decision === 'Rejected' ? 'Rejected' : updatedInvoice.status }
          : inv,
      ),
      advanceRequests: prev.advanceRequests.map((adv) =>
        adv.id === advance.id
          ? {
              ...adv,
              status: decision,
              reviewScore: score,
              approvalMode: decision === 'Approved' ? 'Auto' : decision === 'PendingReview' ? 'Manual' : adv.approvalMode,
              rejectionReason: decision === 'Rejected' ? 'Client disputed the invoice or review checks failed.' : undefined,
              updatedAt: new Date().toISOString(),
            }
          : adv,
      ),
      aiReviewSnapshots: [buildAiSnapshot(advance.id, score, flags), ...prev.aiReviewSnapshots],
      currentPage: 'advanceDetail',
      pageParams: { advanceId: advance.id },
    }));
    window.location.hash = buildRouteHash('advanceDetail', { advanceId: advance.id });

    if (status === 'Confirmed') {
      updateTrustScore(user.id, 5, 'Client confirmed a factoring invoice.');
      showToast('Client confirmed the invoice.', 'success');
    } else {
      updateTrustScore(user.id, -20, 'Client disputed a factoring invoice.');
      showToast('Client disputed the invoice.', 'error');
    }
  };

  const adminDecision = (advanceId: string, decision: AdminDecision) => {
    const advance = state.advanceRequests.find((adv) => adv.id === advanceId);
    if (!advance) return;
    const invoiceStatus = decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'PendingReview';
    const advanceStatus = decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'PendingReview';

    setState((prev) => ({
      ...prev,
      advanceRequests: prev.advanceRequests.map((adv) =>
        adv.id === advanceId
          ? {
              ...adv,
              status: advanceStatus,
              approvalMode: 'Manual',
              rejectionReason: decision === 'Rejected' ? 'Admin reviewer rejected the request.' : undefined,
              updatedAt: new Date().toISOString(),
            }
          : adv,
      ),
      invoices: prev.invoices.map((inv) => (inv.id === advance.invoiceId ? { ...inv, status: invoiceStatus } : inv)),
      adminReviews: [
        {
          id: generateId('review'),
          advanceRequestId: advanceId,
          reviewerUserId: currentUser.id,
          decision,
          notes: decision === 'RequestMoreInfo' ? 'Additional evidence requested.' : 'Manual review completed.',
          createdAt: new Date().toISOString(),
        },
        ...prev.adminReviews,
      ],
      currentPage: 'advanceDetail',
      pageParams: { advanceId },
    }));
    window.location.hash = buildRouteHash('advanceDetail', { advanceId });

    showToast(
      decision === 'Approved'
        ? 'Admin approved the advance request.'
        : decision === 'Rejected'
          ? 'Admin rejected the advance request.'
          : 'Request marked as needing more information.',
      decision === 'Rejected' ? 'error' : 'success',
    );
  };

  const simulateNextStep = (advanceId: string) => {
    const advance = state.advanceRequests.find((adv) => adv.id === advanceId);
    const invoice = state.invoices.find((inv) => inv.id === advance?.invoiceId);
    if (!advance || !invoice) return;

    const updateAdvanceStatus = (status: AdvanceRequest['status'], invoiceStatus: Invoice['status']) => {
      setState((prev) => ({
        ...prev,
        advanceRequests: prev.advanceRequests.map((adv) => (adv.id === advanceId ? { ...adv, status, updatedAt: new Date().toISOString() } : adv)),
        invoices: prev.invoices.map((inv) => (inv.id === invoice.id ? { ...inv, status: invoiceStatus } : inv)),
      }));
    };

    if (advance.status === 'Approved') {
      updateAdvanceStatus('Disbursed', 'Disbursed');
      addTransaction({
        userId: advance.userId,
        invoiceId: invoice.id,
        advanceRequestId: advance.id,
        type: 'AdvanceDisbursement',
        direction: 'Credit',
        amount: advance.advanceAmount,
        description: `${formatCurrency(advance.advanceAmount, invoice.currency)} sent to user bank account.`,
      });
      showToast('Advance disbursed.');
      return;
    }

    if (advance.financingModel === 'InvoiceDiscounting') {
      if (advance.status === 'Disbursed') {
        updateAdvanceStatus('ClientPaymentDetected', 'ClientPaymentDetected');
        addTransaction({
          userId: advance.userId,
          invoiceId: invoice.id,
          advanceRequestId: advance.id,
          type: 'DetectedIncomingPayment',
          direction: 'Internal',
          amount: invoice.amount,
          description: 'Client payment detected in the freelancer account.',
        });
        showToast('Client payment detected.');
        return;
      }

      if (advance.status === 'ClientPaymentDetected') {
        updateAdvanceStatus('Repaid', 'Paid');
        addTransaction({
          userId: advance.userId,
          invoiceId: invoice.id,
          advanceRequestId: advance.id,
          type: 'UserRepayment',
          direction: 'Debit',
          amount: advance.expectedRepaymentAmount,
          description: 'Advance and fee repaid after client payment.',
        });
        addTransaction({
          userId: advance.userId,
          invoiceId: invoice.id,
          advanceRequestId: advance.id,
          type: 'PlatformFee',
          direction: 'Internal',
          amount: advance.feeAmount,
          description: 'Fixed fee collected at repayment.',
        });
        updateTrustScore(advance.userId, 10, 'Repaid discounting advance after client payment detection.');
        showToast('Repayment complete.');
        return;
      }
    }

    if (advance.financingModel === 'InvoiceFactoring') {
      if (advance.status === 'Disbursed') {
        updateAdvanceStatus('ClientPaidHassil', 'ClientPaidHassil');
        addTransaction({
          userId: advance.userId,
          invoiceId: invoice.id,
          advanceRequestId: advance.id,
          type: 'ClientPaymentToHassil',
          direction: 'Credit',
          amount: invoice.amount,
          description: 'Client paid the invoice to Hassil.',
        });
        addTransaction({
          userId: advance.userId,
          invoiceId: invoice.id,
          advanceRequestId: advance.id,
          type: 'PlatformFee',
          direction: 'Internal',
          amount: advance.feeAmount,
          description: 'Fixed fee collected from settlement.',
        });
        showToast('Client payment recorded.');
        return;
      }

      if (advance.status === 'ClientPaidHassil') {
        updateAdvanceStatus('Repaid', 'Paid');
        addTransaction({
          userId: advance.userId,
          invoiceId: invoice.id,
          advanceRequestId: advance.id,
          type: 'BufferRelease',
          direction: 'Credit',
          amount: advance.settlementBufferAmount,
          description: 'Remaining buffer released to the business.',
        });
        updateTrustScore(advance.userId, 10, 'Completed factoring cycle and buffer release.');
        showToast('Settlement complete.');
      }
    }
  };

  const renderPage = () => {
    if (state.currentPage === 'landing') return <LandingPage go={go} />;
    if (state.currentPage === 'selectType') return <AccountTypePage go={go} />;
    if (state.currentPage === 'onboarding') return <OnboardingPage state={state} setState={setState} go={go} showToast={showToast} />;
    if (state.currentPage === 'clientConfirmation') {
      return <ClientConfirmationPage state={state} token={state.pageParams.token} onConfirm={confirmClientInvoice} go={go} />;
    }

    return (
      <AppLayout
        state={state}
        currentUser={currentUser}
        go={go}
        setCurrentUser={setCurrentUser}
        resetDemo={resetDemo}
      >
        {state.currentPage === 'dashboard' && <DashboardPage state={state} user={currentUser} go={go} />}
        {state.currentPage === 'invoices' && <InvoicesPage state={state} user={currentUser} go={go} />}
        {state.currentPage === 'newInvoice' && <NewInvoicePage state={state} user={currentUser} createInvoice={createInvoice} go={go} />}
        {state.currentPage === 'invoiceDetail' && (
          <InvoiceDetailPage
            state={state}
            invoiceId={state.pageParams.invoiceId}
            go={go}
            addDocumentPlaceholder={addDocumentPlaceholder}
          />
        )}
        {state.currentPage === 'advanceRequest' && (
          <AdvanceRequestPage state={state} invoiceId={state.pageParams.invoiceId} go={go} createAdvanceRequest={createAdvanceRequest} />
        )}
        {state.currentPage === 'advanceDetail' && (
          <AdvanceDetailPage state={state} advanceId={state.pageParams.advanceId} go={go} simulateNextStep={simulateNextStep} />
        )}
        {state.currentPage === 'adminReview' && <AdminReviewPage state={state} go={go} adminDecision={adminDecision} />}
        {state.currentPage === 'ledger' && <LedgerPage state={state} user={currentUser} />}
        {state.currentPage === 'cashFlow' && <CashFlowPage state={state} user={currentUser} go={go} />}
      </AppLayout>
    );
  };

  return (
    <>
      {renderPage()}
      <ToastContainer toasts={state.toasts} />
    </>
  );
}

function LandingPage({ go }: { go: GoTo }) {
  return (
    <main className="landing">
      <div className="landing-mesh" />
      <div className="landing-grid" />
      <nav className="landing-nav">
        <Logo onClick={() => go('landing')} />
        <button className="btn btn-secondary" onClick={() => go('dashboard')}><Icon name="open" /> Open App</button>
      </nav>
      <section className="landing-hero">
        <div className="landing-tag">Receivables finance for SMEs and freelancers</div>
        <h1>Turn approved work into predictable cash flow.</h1>
        <p>
          Hassil gives teams one place to verify invoices, request advances, confirm clients, and track settlement without hidden fees.
        </p>
        <div className="landing-cta">
          <button className="btn btn-primary btn-xl" onClick={() => go('dashboard')}><Icon name="open" /> Open Workspace</button>
          <button className="btn btn-secondary btn-xl" onClick={() => go('selectType')}><Icon name="plus" /> Create Profile</button>
        </div>
        <div className="landing-proof-row">
          <span>Flat fee shown upfront</span>
          <span>Client confirmation when needed</span>
          <span>Ledger-backed settlement trail</span>
        </div>
      </section>
      <section className="landing-product">
        <div className="product-preview" aria-label="Hassil workspace preview">
          <div className="preview-topbar">
            <div>
              <span>Ahmed Studio</span>
              <strong>Invoice Factoring</strong>
            </div>
            <div className="preview-score">Trust 60 · Good</div>
          </div>
          <div className="preview-metrics">
            <div><span>Open receivables</span><strong>$30,400</strong></div>
            <div><span>Available now</span><strong>$27,360</strong></div>
            <div><span>Fixed fees</span><strong>$608</strong></div>
          </div>
          <div className="preview-table">
            <div><span>AHM-2026-019</span><strong>Awaiting client</strong><em>$12,400</em></div>
            <div><span>AHM-2026-018</span><strong>Ready to request</strong><em>$18,000</em></div>
            <div><span>AHM-2026-016</span><strong>Disputed</strong><em>$7,600</em></div>
          </div>
        </div>
        <div className="landing-workflow">
          <div><span>01</span><strong>Verify receivable</strong><p>Invoice details, evidence, duplicate checks, and eligibility rules.</p></div>
          <div><span>02</span><strong>Choose the right model</strong><p>Factoring for confirmed client payment, discounting for private freelancer advances.</p></div>
          <div><span>03</span><strong>Track money movement</strong><p>Funding, repayment, fee collection, buffer release, and trust-score changes.</p></div>
        </div>
      </section>
      <section className="landing-models">
        <div className="model-card factoring">
          <div className="model-card-icon blue-soft">SMB</div>
          <h3>Factoring for businesses</h3>
          <p>Client confirms the invoice, pays Hassil on the due date, and the remaining balance is released after settlement.</p>
          <div className="model-metrics">
            <div><div className="model-metric-val">80–95%</div><div className="model-metric-label">Advance range</div></div>
            <div><div className="model-metric-val">0.8–3.5%</div><div className="model-metric-label">Flat fee</div></div>
          </div>
        </div>
        <div className="model-card discounting">
          <div className="model-card-icon gold-soft">FR</div>
          <h3>Discounting for freelancers</h3>
          <p>The client relationship stays unchanged. Hassil advances cash, then the freelancer repays after receiving payment.</p>
          <div className="model-metrics">
            <div><div className="model-metric-val">70–90%</div><div className="model-metric-label">Advance range</div></div>
            <div><div className="model-metric-val">1.5–5%</div><div className="model-metric-label">Flat fee</div></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AccountTypePage({ go }: { go: GoTo }) {
  return (
    <main className="account-select-page">
      <div className="page-heading centered">
        <Logo onClick={() => go('landing')} />
        <h1>Choose account type</h1>
        <p>Pick the flow that matches how the invoice will be repaid.</p>
      </div>
      <div className="account-select-cards">
        <button className="account-type-card" onClick={() => go('onboarding', { type: 'SmallBusiness' })}>
          <div className="account-type-icon blue-soft">SMB</div>
          <h2>Small Business</h2>
          <p>Best when the client can confirm and pay Hassil directly.</p>
          <ul className="account-type-features">
            <li>Client confirms invoice</li>
            <li>Client pays Hassil directly</li>
            <li>Settlement buffer released after payment</li>
          </ul>
        </button>
        <button className="account-type-card" onClick={() => go('onboarding', { type: 'Freelancer' })}>
          <div className="account-type-icon gold-soft">FR</div>
          <h2>Freelancer</h2>
          <p>Best when the client or platform pays you first.</p>
          <ul className="account-type-features">
            <li>No client notification</li>
            <li>Client pays freelancer normally</li>
            <li>Freelancer repays after payment detection</li>
          </ul>
        </button>
      </div>
    </main>
  );
}

function OnboardingPage({
  state,
  setState,
  go,
  showToast,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  go: GoTo;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const type = (state.pageParams.type as AccountType) || 'SmallBusiness';
  const [form, setForm] = useState({
    name: type === 'SmallBusiness' ? 'Cairo Visual Works' : 'Mona UX Studio',
    registrationNumber: 'EG-DEMO-2026',
    email: type === 'SmallBusiness' ? 'finance@cairovisual.example' : 'mona.ux@example.com',
    phone: '+20 100 000 4444',
    country: 'Egypt',
    bankName: type === 'SmallBusiness' ? 'Cairo Visual Works LLC' : 'Mona Ahmed',
    bankLast4: '7781',
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const user: User = {
      id: generateId('user'),
      accountType: type,
      role: 'User',
      email: form.email,
      phone: form.phone,
      country: form.country,
      trustScore: 45,
      status: 'Active',
      createdAt: new Date().toISOString(),
      smallBusinessProfile:
        type === 'SmallBusiness'
          ? {
              businessName: form.name,
              registrationNumber: form.registrationNumber,
              businessBankAccountName: form.bankName,
              businessBankAccountLast4: form.bankLast4,
            }
          : undefined,
      freelancerProfile:
        type === 'Freelancer'
          ? {
              fullName: form.name,
              personalBankAccountName: form.bankName,
              personalBankAccountLast4: form.bankLast4,
            }
          : undefined,
    };

    setState((prev) => ({ ...prev, users: [user, ...prev.users], currentUserId: user.id, currentPage: 'dashboard', pageParams: {} }));
    window.location.hash = buildRouteHash('dashboard');
    showToast('Profile completed.', 'success');
  };

  return (
    <main className="account-select-page onboarding-shell">
      <div className="card onboarding-card">
        <Logo onClick={() => go('landing')} />
        <div className="page-heading compact-heading">
          <h1>{type === 'SmallBusiness' ? 'Small Business Onboarding' : 'Freelancer Onboarding'}</h1>
          <p>Enter the basic profile and bank details needed to request advances.</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>{type === 'SmallBusiness' ? 'Business name' : 'Full name'}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            {type === 'SmallBusiness' && (
              <div className="form-group">
                <label>Registration number</label>
                <input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Phone number</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Verified bank account name</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Bank account last 4 digits</label>
              <input maxLength={4} value={form.bankLast4} onChange={(e) => setForm({ ...form, bankLast4: e.target.value })} required />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={() => go('selectType')}>Back</button>
            <button className="btn btn-primary" type="submit">Complete Profile</button>
          </div>
        </form>
      </div>
    </main>
  );
}

function AppLayout({
  state,
  currentUser,
  go,
  setCurrentUser,
  resetDemo,
  children,
}: {
  state: AppState;
  currentUser: User;
  go: GoTo;
  setCurrentUser: (id: string) => void;
  resetDemo: () => void;
  children: React.ReactNode;
}) {
  const pendingToken = state.invoices.find((inv) => inv.clientConfirmation?.status === 'Pending')?.clientConfirmation?.token;
  const pendingReviews = state.advanceRequests.filter((adv) => adv.status === 'PendingReview').length;
  const model = currentUser.accountType === 'Freelancer' ? 'Invoice Discounting' : 'Invoice Factoring';
  const pageTitleMap: Partial<Record<PageName, string>> = {
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    newInvoice: 'Create invoice',
    invoiceDetail: 'Invoice detail',
    advanceRequest: 'Advance quote',
    advanceDetail: 'Advance detail',
    adminReview: 'Admin review',
    ledger: 'Ledger',
    cashFlow: 'Cash-flow forecast',
  };

  const navItems: { page: PageName; label: string; active: boolean; badge?: number }[] = [
    { page: 'dashboard', label: 'Home', active: state.currentPage === 'dashboard' },
    { page: 'invoices', label: 'Invoices', active: ['invoices', 'invoiceDetail', 'advanceRequest', 'advanceDetail', 'newInvoice'].includes(state.currentPage) },
    { page: 'cashFlow', label: 'Cash Flow', active: state.currentPage === 'cashFlow' },
    { page: 'ledger', label: 'Ledger', active: state.currentPage === 'ledger' },
    { page: 'adminReview', label: 'Admin', active: state.currentPage === 'adminReview', badge: pendingReviews },
  ];

  return (
    <div className="app-layout light-shell">
      <header className="app-header">
        <div className="app-header-main">
          <div className="brand-cluster">
            <Logo onClick={() => go('landing')} />
          </div>

          <nav className="top-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.page}
                className={`nav-item pill-nav ${item.active ? 'active' : ''}`}
                onClick={() => go(item.page)}
              >
                {item.label}
                {!!item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
            {pendingToken && (
              <button className="nav-item pill-nav" onClick={() => go('clientConfirmation', { token: pendingToken })}>
                Client Link
              </button>
            )}
          </nav>

          <div className="top-actions">
            <button className="btn btn-primary" onClick={() => go('newInvoice')}><Icon name="plus" /> Create Invoice</button>
          </div>
        </div>

        <div className="workspace-strip">
          <div className="workspace-context">
            <span className="workspace-page">{pageTitleMap[state.currentPage] || 'Hassil'}</span>
            <span className="workspace-divider" />
            <span className="workspace-model">{model}</span>
            <span className="workspace-status">{currentUser.role === 'Admin' ? 'Review console' : 'Verified'}</span>
          </div>

          <div className="workspace-controls">
            <label className="profile-select" htmlFor="demo-user">
              <span>Profile</span>
              <select id="demo-user" value={currentUser.id} onChange={(event) => setCurrentUser(event.target.value)}>
                {state.users.slice(0, 5).map((demoUser) => (
                  <option key={demoUser.id} value={demoUser.id}>{getUserDisplayName(demoUser)}</option>
                ))}
              </select>
            </label>

            <CompactTrustScore score={currentUser.trustScore} />

            <details className="dev-menu">
              <summary aria-label="Open prototype tools"><Icon name="review" /></summary>
              <div className="dev-menu-panel">
                <span className="sandbox-pill">Prototype</span>
                <button className="btn btn-secondary btn-sm" onClick={() => go('selectType')}>Switch Flow</button>
                <button className="btn btn-secondary btn-sm" onClick={resetDemo}>Reset Data</button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="page-content">
          <DemoGuide state={state} currentUser={currentUser} go={go} />
          {children}
        </div>
      </main>
    </div>
  );
}

function DashboardPage({ state, user, go }: { state: AppState; user: User; go: GoTo }) {
  const userInvoices = state.invoices.filter((inv) => inv.userId === user.id);
  const userAdvances = state.advanceRequests.filter((adv) => adv.userId === user.id);
  const outstanding = userInvoices.filter((inv) => inv.status !== 'Paid' && inv.status !== 'Rejected').reduce((sum, inv) => sum + inv.amount, 0);
  const activeAdvances = userAdvances.filter((adv) => !['Repaid', 'Rejected'].includes(adv.status));
  const balance = state.transactions
    .filter((tx) => tx.userId === user.id && moneyMovementTypes.has(tx.type))
    .reduce((sum, tx) => sum + (tx.direction === 'Debit' ? -tx.amount : tx.amount), 0);
  const recentTx = state.transactions.filter((tx) => tx.userId === user.id).slice(0, 5);
  const model = user.accountType === 'Freelancer' ? 'Invoice Discounting' : 'Invoice Factoring';

  return (
    <>
      <PageHeading
        title={`Welcome back, ${getUserDisplayName(user)}`}
        description={`${model} workspace for invoices, advances, cash flow, and settlement activity.`}
      />
      <section className="stat-grid">
        <StatCard tone="gold" label="Outstanding invoices" value={formatCurrency(outstanding)} sub={`${userInvoices.length} invoice records`} />
        <StatCard tone="blue" label="Active advances" value={String(activeAdvances.length)} sub="Pending, approved, or funded" />
        <StatCard tone="green" label="Available balance" value={formatCurrency(balance)} sub="Ledger balance" />
        <StatCard tone="amber" label="Trust score" value={`${user.trustScore}/100`} sub={getTrustScoreLabel(user.trustScore)} />
      </section>
      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Invoices</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => go('invoices')}>View all</button>
          </div>
          <Table
            headers={['Invoice', 'Client', 'Amount', 'Status', 'Action']}
            emptyTitle="No invoices yet"
            emptyDescription="Create an invoice to see advance options."
            emptyAction={<button className="btn btn-primary btn-sm" onClick={() => go('newInvoice')}><Icon name="plus" /> Create invoice</button>}
            rows={userInvoices.slice(0, 5).map((invoice) => [
              <button className="link-button" onClick={() => go('invoiceDetail', { invoiceId: invoice.id })}>{invoice.invoiceNumber}</button>,
              invoice.client.name,
              formatCurrency(invoice.amount, invoice.currency),
              <StatusBadge status={invoice.status} />,
              invoice.advanceRequestId ? (
                <button className="btn btn-secondary btn-sm" onClick={() => go('advanceDetail', { advanceId: invoice.advanceRequestId! })}><Icon name="open" /> Open advance</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => go('advanceRequest', { invoiceId: invoice.id })}><Icon name="advance" /> Request advance</button>
              ),
            ])}
          />
        </div>
        <div className="card card-gold">
          <h2 className="card-title">Next steps</h2>
          <div className="model-summary-list">
            <div><strong>1.</strong> Open or create an invoice.</div>
            <div><strong>2.</strong> Review the advance quote.</div>
            <div><strong>3.</strong> Confirm the client step when required.</div>
            <div><strong>4.</strong> Track funding and settlement.</div>
          </div>
          <button className="btn btn-primary full-width mt-16" onClick={() => go('newInvoice')}><Icon name="plus" /> Create Invoice</button>
        </div>
      </div>
      <div className="card mt-24">
        <div className="card-header"><h2 className="card-title">Recent ledger activity</h2><button className="btn btn-secondary btn-sm" onClick={() => go('ledger')}>Open ledger</button></div>
        <TransactionTimeline transactions={recentTx} />
      </div>
    </>
  );
}

function InvoicesPage({ state, user, go }: { state: AppState; user: User; go: GoTo }) {
  const invoices = state.invoices.filter((inv) => inv.userId === user.id);
  return (
    <>
      <PageHeading title="Invoices" description="Manage receivables, evidence, and advance requests." />
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Invoice portfolio</h2>
          <button className="btn btn-primary" onClick={() => go('newInvoice')}>Create Invoice</button>
        </div>
        <Table
          headers={['Invoice', 'Source', 'Client', 'Due date', 'Amount', 'Status', 'Advance']}
          emptyTitle="No invoices yet"
          emptyDescription="Create your first invoice to request an advance."
          emptyAction={<button className="btn btn-primary btn-sm" onClick={() => go('newInvoice')}><Icon name="plus" /> Create invoice</button>}
          rows={invoices.map((invoice) => [
            <button className="link-button" onClick={() => go('invoiceDetail', { invoiceId: invoice.id })}>{invoice.invoiceNumber}</button>,
            sourceLabel(invoice.receivableSource),
            invoice.client.name,
            formatDate(invoice.dueDate),
            formatCurrency(invoice.amount, invoice.currency),
            <StatusBadge status={invoice.status} />,
            invoice.advanceRequestId ? (
              <button className="btn btn-secondary btn-sm" onClick={() => go('advanceDetail', { advanceId: invoice.advanceRequestId! })}><Icon name="open" /> View advance</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => go('advanceRequest', { invoiceId: invoice.id })}><Icon name="advance" /> Request</button>
            ),
          ])}
        />
      </div>
    </>
  );
}

function NewInvoicePage({ state, user, createInvoice, go }: { state: AppState; user: User; createInvoice: (payload: InvoiceFormPayload) => void; go: GoTo }) {
  const rules = getRules(user.accountType, user.trustScore);
  const [form, setForm] = useState({
    clientName: user.accountType === 'SmallBusiness' ? 'Noura Retail Group' : 'Lynx Digital',
    clientEmail: user.accountType === 'SmallBusiness' ? 'ap@nouraretail.sa' : 'finance@lynxdigital.qa',
    clientCountry: user.accountType === 'SmallBusiness' ? 'Saudi Arabia' : 'Qatar',
    invoiceNumber: user.accountType === 'SmallBusiness' ? `AHM-2026-${Math.floor(100 + Math.random() * 200)}` : `SAR-2026-${Math.floor(100 + Math.random() * 200)}`,
    receivableSource: user.accountType === 'Freelancer' ? 'FreelancePlatformPayout' : 'DirectClientInvoice',
    amount: user.accountType === 'SmallBusiness' ? 16000 : 1800,
    currency: 'USD',
    issueDate: '2026-04-28',
    dueDate: user.accountType === 'SmallBusiness' ? '2026-06-12' : '2026-05-30',
    description: user.accountType === 'SmallBusiness' ? 'Campaign assets delivered and approved by client.' : 'Design project payout waiting for platform clearance.',
    paymentTerms: user.accountType === 'SmallBusiness' ? 'Net 45' : 'Platform payout hold',
    hasEvidence: true,
  });
  const fingerprint = createFingerprint(form.invoiceNumber, form.clientEmail, Number(form.amount) || 0, form.dueDate, form.receivableSource);
  const duplicate = state.invoices.some((invoice) => invoice.fingerprint === fingerprint);
  const dueDays = daysUntilDate(form.dueDate);
  const errors = [
    Number(form.amount) <= 0 ? 'Amount must be greater than zero.' : '',
    new Date(form.dueDate).getTime() <= new Date(form.issueDate).getTime() ? 'Due date must be after the issue date.' : '',
    dueDays < 0 ? 'Due date cannot be in the past.' : '',
    duplicate ? 'An invoice with the same number, client, amount, date, and source already exists.' : '',
    !form.hasEvidence ? 'Attach invoice evidence before submitting.' : '',
  ].filter((item): item is string => Boolean(item));
  const warnings = [
    Number(form.amount) > rules.maxInvoice * 0.85 ? `Amount is close to the current ${formatCurrency(rules.maxInvoice, form.currency)} limit.` : '',
    dueDays > 75 ? 'Long payment terms may require extra review.' : '',
  ].filter((item): item is string => Boolean(item));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (errors.length > 0) return;
    createInvoice(form as InvoiceFormPayload);
  };

  return (
    <>
      <PageHeading title="Create invoice" description="Enter invoice details and attach evidence for review." />
      <form className="card form-card" onSubmit={submit}>
        <Breadcrumbs items={[{ label: 'Invoices', onClick: () => go('invoices') }, { label: 'Create invoice' }]} />
        <div className="form-grid-2">
          <div className="form-group"><label>Invoice number</label><input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} required /></div>
          <div className="form-group"><label>Receivable source</label><select value={form.receivableSource} onChange={(e) => setForm({ ...form, receivableSource: e.target.value as Invoice['receivableSource'] })}><option value="DirectClientInvoice">Direct client invoice</option><option value="FreelancePlatformPayout">Freelance platform payout</option></select></div>
          <div className="form-group"><label>Client name</label><input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required /></div>
          <div className="form-group"><label>Client email</label><input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} required /></div>
          <div className="form-group"><label>Client country</label><input value={form.clientCountry} onChange={(e) => setForm({ ...form, clientCountry: e.target.value })} /></div>
          <div className="form-group"><label>Currency</label><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}><option>USD</option><option>AED</option><option>SAR</option><option>EGP</option></select></div>
          <div className="form-group"><label>Amount</label><input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required /></div>
          <div className="form-group"><label>Issue date</label><input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required /></div>
          <div className="form-group"><label>Due date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></div>
          <div className="form-group"><label>Payment terms</label><input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <label className="checkbox-row mb-18">
          <input type="checkbox" checked={form.hasEvidence} onChange={(e) => setForm({ ...form, hasEvidence: e.target.checked })} />
          <span>Invoice evidence is attached.</span>
        </label>
        <FormFeedback errors={errors} warnings={warnings} />
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => go('invoices')}><Icon name="back" /> Cancel</button><button className="btn btn-primary" type="submit" disabled={errors.length > 0}><Icon name="plus" /> Create Invoice</button></div>
      </form>
    </>
  );
}

function InvoiceDetailPage({
  state,
  invoiceId,
  go,
  addDocumentPlaceholder,
}: {
  state: AppState;
  invoiceId?: string;
  go: GoTo;
  addDocumentPlaceholder: (invoiceId: string, documentType?: string, fileName?: string) => void;
}) {
  const invoice = state.invoices.find((inv) => inv.id === invoiceId);
  const user = state.users.find((u) => u.id === invoice?.userId);
  if (!invoice || !user) return <EmptyState title="Invoice not found" actionLabel="Back to invoices" onAction={() => go('invoices')} />;
  const quote = calculateQuote(user, invoice);
  const advance = state.advanceRequests.find((adv) => adv.id === invoice.advanceRequestId);
  const duplicate = state.invoices.filter((inv) => inv.fingerprint === invoice.fingerprint).length > 1;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Invoices', onClick: () => go('invoices') }, { label: invoice.invoiceNumber }]} />
      <PageHeading title={`Invoice ${invoice.invoiceNumber}`} description="Review invoice details, evidence, and advance readiness." />
      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Invoice details</h2><StatusBadge status={invoice.status} /></div>
          <DetailGrid
            items={[
              ['Client', `${invoice.client.name} · ${invoice.client.email}`],
              ['Amount', formatCurrency(invoice.amount, invoice.currency)],
              ['Issue date', formatDate(invoice.issueDate)],
              ['Due date', formatDate(invoice.dueDate)],
              ['Receivable source', sourceLabel(invoice.receivableSource)],
              ['Fingerprint', invoice.fingerprint],
              ['Description', invoice.description || 'No description'],
              ['Payment terms', invoice.paymentTerms || 'Not specified'],
            ]}
          />
        </div>
        <div className="card card-gold">
          <h2 className="card-title">Advance option</h2>
          <ModelBadge model={quote.financingModel} />
          <p className="soft-text mt-12">
            {quote.financingModel === 'InvoiceFactoring'
              ? 'Client confirms the invoice and pays Hassil on the due date.'
              : 'Client is not notified. Repayment happens after client payment is received.'}
          </p>
          <VerificationChecklist invoice={invoice} duplicate={duplicate} quote={quote} />
          <div className="form-actions stacked">
            {advance ? (
              <button className="btn btn-primary full-width" onClick={() => go('advanceDetail', { advanceId: advance.id })}><Icon name="open" /> Open Advance</button>
            ) : (
              <button className="btn btn-primary full-width" onClick={() => go('advanceRequest', { invoiceId: invoice.id })}><Icon name="advance" /> Request Advance</button>
            )}
          </div>
          <MockEvidenceUpload invoiceId={invoice.id} onUpload={addDocumentPlaceholder} />
        </div>
      </div>
    </>
  );
}

function AdvanceRequestPage({ state, invoiceId, go, createAdvanceRequest }: { state: AppState; invoiceId?: string; go: GoTo; createAdvanceRequest: (invoiceId: string, accepted: boolean) => void }) {
  const invoice = state.invoices.find((inv) => inv.id === invoiceId);
  const user = state.users.find((u) => u.id === invoice?.userId);
  const [accepted, setAccepted] = useState(false);
  if (!invoice || !user) return <EmptyState title="Invoice not found" actionLabel="Back to invoices" onAction={() => go('invoices')} />;
  const quote = calculateQuote(user, invoice);
  const duplicate = state.invoices.filter((inv) => inv.fingerprint === invoice.fingerprint).length > 1;
  const score = scoreAdvance(user, invoice, quote.financingModel, accepted, duplicate);
  const flags = getReviewFlags(user, invoice, score, quote.financingModel);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Invoices', onClick: () => go('invoices') }, { label: invoice.invoiceNumber, onClick: () => go('invoiceDetail', { invoiceId: invoice.id }) }, { label: 'Advance quote' }]} />
      <PageHeading title="Advance quote" description="Review the amount, fee, repayment path, and checks before submitting." />
      <div className="grid-2 wide-left">
        <div>
          <QuoteCard invoice={invoice} quote={quote} />
          <div className="card mt-24">
            <h2 className="card-title">Terms</h2>
            <p className="soft-text mt-8">The fee is fixed upfront and shown before submission.</p>
            <label className="checkbox-row mt-16">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>I accept the advance terms shown above.</span>
            </label>
            <button className="btn btn-primary full-width mt-16" onClick={() => createAdvanceRequest(invoice.id, accepted)}><Icon name="advance" /> Submit Advance Request</button>
          </div>
        </div>
        <div className="card card-gold">
          <h2 className="card-title">Checks</h2>
          <VerificationChecklist invoice={invoice} duplicate={duplicate} quote={quote} />
          <ReviewScore score={score} flags={flags} />
        </div>
      </div>
    </>
  );
}

function AdvanceDetailPage({ state, advanceId, go, simulateNextStep }: { state: AppState; advanceId?: string; go: GoTo; simulateNextStep: (advanceId: string) => void }) {
  const advance = state.advanceRequests.find((adv) => adv.id === advanceId);
  const invoice = state.invoices.find((inv) => inv.id === advance?.invoiceId);
  const user = state.users.find((u) => u.id === advance?.userId);
  if (!advance || !invoice || !user) return <EmptyState title="Advance not found" actionLabel="Back to dashboard" onAction={() => go('dashboard')} />;

  const nextLabel = getNextSimulationLabel(advance.status, advance.financingModel);
  const relatedTransactions = state.transactions.filter((tx) => tx.advanceRequestId === advance.id);
  const ai = state.aiReviewSnapshots.find((snapshot) => snapshot.advanceRequestId === advance.id);
  const confirmationToken = invoice.clientConfirmation?.token;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Invoices', onClick: () => go('invoices') }, { label: invoice.invoiceNumber, onClick: () => go('invoiceDetail', { invoiceId: invoice.id }) }, { label: 'Advance' }]} />
      <PageHeading title="Advance detail" description="Track funding, repayment, and settlement status." />
      <LifecycleStepper status={advance.status} model={advance.financingModel} />
      <section className="stat-grid">
        <StatCard tone="gold" label="Invoice amount" value={formatCurrency(invoice.amount, invoice.currency)} sub={invoice.invoiceNumber} />
        <StatCard tone="green" label="Advance amount" value={formatCurrency(advance.advanceAmount, invoice.currency)} sub={`${Math.round(advance.requestedPercent * 100)}% requested`} />
        <StatCard tone="amber" label="Flat fee" value={formatCurrency(advance.feeAmount, invoice.currency)} sub={`${(advance.feeRate * 100).toFixed(1)}% fixed upfront`} />
        <StatCard tone="blue" label="Status" value={getStatusLabel(advance.status)} sub={getModelLabel(advance.financingModel)} />
      </section>
      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-header">
            <div><h2 className="card-title">Repayment path</h2><ModelBadge model={advance.financingModel} /></div>
            <StatusBadge status={advance.status} />
          </div>
          <DetailGrid
            items={[
              ['User', getUserDisplayName(user)],
              ['Client', `${invoice.client.name} · ${invoice.client.email}`],
              ['Due date', formatDate(invoice.dueDate)],
              ['Repayment party', advance.repaymentParty === 'Client' ? 'Client pays Hassil' : 'User repays Hassil'],
              ['Client notification', advance.clientNotificationRequired ? 'Required' : 'Not required'],
              ['Expected repayment', formatCurrency(advance.expectedRepaymentAmount, invoice.currency)],
              ['Settlement buffer', formatCurrency(advance.settlementBufferAmount, invoice.currency)],
              ['Review score', `${advance.reviewScore}/100`],
            ]}
          />
          {confirmationToken && advance.status === 'PendingClientConfirmation' && (
            <div className="quote-disclaimer mt-16">
              Client confirmation is required before funding.
              <button className="btn btn-secondary btn-sm ml-auto" onClick={() => go('clientConfirmation', { token: confirmationToken })}><Icon name="open" /> Open Client Link</button>
            </div>
          )}
          {nextLabel && <button className="btn btn-sim full-width mt-16" onClick={() => simulateNextStep(advance.id)}><Icon name="next" /> {nextLabel}</button>}
          {!nextLabel && <p className="soft-text mt-16">No next step is available for this status.</p>}
        </div>
        <div>
          {ai && <AiReviewCard snapshot={ai} />}
          <div className="card mt-24">
            <div className="card-header"><h2 className="card-title">Timeline</h2><button className="btn btn-secondary btn-sm" onClick={() => go('ledger')}>Ledger</button></div>
            <TransactionTimeline transactions={relatedTransactions} />
          </div>
        </div>
      </div>
    </>
  );
}

function ClientConfirmationPage({ state, token, onConfirm, go }: { state: AppState; token?: string; onConfirm: (token: string, status: ConfirmationStatus, note: string) => void; go: GoTo }) {
  const invoice = state.invoices.find((inv) => inv.clientConfirmation?.token === token);
  const [note, setNote] = useState('Work received and invoice details are correct.');
  if (!invoice || !token) return <EmptyPublicState go={go} />;
  const confirmation = invoice.clientConfirmation;
  const linkExpired = confirmation?.status === 'Pending' && new Date(confirmation.expiresAt).getTime() < Date.now();
  if (linkExpired) {
    return (
      <main className="confirm-page">
        <div className="confirm-card">
          <Logo onClick={() => go('landing')} />
          <h1 className="card-title mt-16">Confirmation link expired</h1>
          <p className="soft-text mt-8">Ask the supplier to issue a new confirmation request.</p>
          <button className="btn btn-primary mt-16" onClick={() => go('dashboard')}><Icon name="back" /> Back to dashboard</button>
        </div>
      </main>
    );
  }
  if (confirmation?.status && confirmation.status !== 'Pending') {
    return (
      <main className="confirm-page">
        <div className="confirm-card">
          <Logo onClick={() => go('landing')} />
          <div className="page-heading compact-heading">
            <h1>{confirmation.status === 'Confirmed' ? 'Invoice confirmed' : 'Invoice disputed'}</h1>
            <p>{confirmation.status === 'Confirmed' ? 'Payment instruction has been recorded.' : 'The supplier has been notified to resolve the issue.'}</p>
          </div>
          <DetailGrid
            items={[
              ['Invoice', invoice.invoiceNumber],
              ['Amount', formatCurrency(invoice.amount, invoice.currency)],
              ['Status', confirmation.status],
              ['Client note', confirmation.clientNote || 'No note added'],
              ['Responded at', confirmation.respondedAt ? formatDateTime(confirmation.respondedAt) : 'Not recorded'],
            ]}
          />
          <button className="btn btn-primary full-width mt-18" onClick={() => go('dashboard')}><Icon name="back" /> Back to dashboard</button>
        </div>
      </main>
    );
  }

  return (
    <main className="confirm-page">
      <div className="confirm-card">
        <Logo onClick={() => go('landing')} />
        <div className="page-heading compact-heading">
          <h1>Client invoice confirmation</h1>
          <p>Confirm the invoice details and payment instruction.</p>
        </div>
        <DetailGrid
          items={[
            ['Supplier', state.users.find((u) => u.id === invoice.userId) ? getUserDisplayName(state.users.find((u) => u.id === invoice.userId)!) : 'Supplier'],
            ['Client', `${invoice.client.name} · ${invoice.client.email}`],
            ['Invoice', invoice.invoiceNumber],
            ['Amount', formatCurrency(invoice.amount, invoice.currency)],
            ['Due date', formatDate(invoice.dueDate)],
            ['Payment instruction', 'Pay the invoice amount to Hassil.'],
          ]}
        />
        <div className="form-group mt-18"><label>Client note</label><textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div className="form-actions">
          <button className="btn btn-danger" onClick={() => onConfirm(token, 'Disputed', note)}>Dispute Invoice</button>
          <button className="btn btn-primary" onClick={() => onConfirm(token, 'Confirmed', note)}>Confirm and Redirect Payment</button>
        </div>
      </div>
    </main>
  );
}

function AdminReviewPage({ state, go, adminDecision }: { state: AppState; go: GoTo; adminDecision: (advanceId: string, decision: AdminDecision) => void }) {
  const selectedAdvanceId = state.pageParams.advanceId;
  const selected = selectedAdvanceId ? state.advanceRequests.find((adv) => adv.id === selectedAdvanceId) : undefined;
  const [filter, setFilter] = useState('Needs action');
  const reviewQueue = state.advanceRequests.filter((adv) => ['PendingReview', 'PendingClientConfirmation', 'Rejected'].includes(adv.status) || adv.reviewScore < 75);
  const pending = reviewQueue.filter((adv) => {
    if (filter === 'Needs action') return true;
    if (filter === 'Pending review') return adv.status === 'PendingReview';
    if (filter === 'Awaiting client') return adv.status === 'PendingClientConfirmation';
    if (filter === 'Rejected') return adv.status === 'Rejected';
    if (filter === 'Low score') return adv.reviewScore < 75;
    if (filter === 'Factoring') return adv.financingModel === 'InvoiceFactoring';
    if (filter === 'Discounting') return adv.financingModel === 'InvoiceDiscounting';
    return true;
  });

  if (selected) {
    const invoice = state.invoices.find((inv) => inv.id === selected.invoiceId)!;
    const user = state.users.find((u) => u.id === selected.userId)!;
    const ai = state.aiReviewSnapshots.find((snapshot) => snapshot.advanceRequestId === selected.id);
    const flags = getReviewFlags(user, invoice, selected.reviewScore, selected.financingModel);
    const reviewSummary = getAdminReviewSummary(selected, invoice, flags);
    return (
      <>
        <Breadcrumbs items={[{ label: 'Admin review', onClick: () => go('adminReview') }, { label: invoice.invoiceNumber }]} />
        <PageHeading title="Admin review detail" description="Review invoice evidence, score, flags, and recommended action." />
        <div className="grid-2 wide-left">
          <div className="card">
            <div className="card-header"><h2 className="card-title">Request signals</h2><StatusBadge status={selected.status} /></div>
            <DecisionSummary summary={reviewSummary} />
            <DetailGrid
              items={[
                ['User type', user.accountType === 'SmallBusiness' ? 'Small Business' : 'Freelancer'],
                ['Financing model', getModelLabel(selected.financingModel)],
                ['Repayment party', selected.repaymentParty],
                ['Client notification required', selected.clientNotificationRequired ? 'Yes' : 'No'],
                ['Trust score', `${user.trustScore}/100`],
                ['Invoice amount', formatCurrency(invoice.amount, invoice.currency)],
                ['Requested advance', `${Math.round(selected.requestedPercent * 100)}% · ${formatCurrency(selected.advanceAmount, invoice.currency)}`],
                ['Fee', `${(selected.feeRate * 100).toFixed(1)}% · ${formatCurrency(selected.feeAmount, invoice.currency)}`],
                ['Client confirmation', invoice.clientConfirmation?.status || 'Not required'],
                ['Supporting documents', `${invoice.documents.length}`],
              ]}
            />
            <ReviewScore score={selected.reviewScore} flags={flags} />
            <div className="form-actions">
              <button className="btn btn-danger" onClick={() => adminDecision(selected.id, 'Rejected')}><Icon name="reject" /> Reject</button>
              <button className="btn btn-secondary" onClick={() => adminDecision(selected.id, 'RequestMoreInfo')}><Icon name="doc" /> Request More Info</button>
              <button className="btn btn-success" onClick={() => adminDecision(selected.id, 'Approved')}><Icon name="check" /> Approve</button>
            </div>
          </div>
          <div>
            {ai && <AiReviewCard snapshot={ai} />}
            <div className="card mt-24"><h2 className="card-title">Reviewer note</h2><p className="soft-text mt-8">Use the AI summary as a guide, then decide from evidence, score, and confirmation status.</p></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading title="Admin review" description="Review pending and flagged requests." />
      <div className="card">
        <SegmentedControl
          value={filter}
          options={['Needs action', 'Pending review', 'Awaiting client', 'Rejected', 'Low score', 'Factoring', 'Discounting']}
          onChange={setFilter}
        />
        <Table
          headers={['User', 'Model', 'Invoice', 'Amount', 'Score', 'Status', 'Action']}
          emptyTitle="No reviews waiting"
          emptyDescription="Flagged or pending requests will appear here."
          rows={pending.map((adv) => {
            const invoice = state.invoices.find((inv) => inv.id === adv.invoiceId)!;
            const user = state.users.find((u) => u.id === adv.userId)!;
            return [
              getUserDisplayName(user),
              <ModelBadge model={adv.financingModel} />,
              invoice.invoiceNumber,
              formatCurrency(invoice.amount, invoice.currency),
              `${adv.reviewScore}/100`,
              <StatusBadge status={adv.status} />,
              <button className="btn btn-primary btn-sm" onClick={() => go('adminReview', { advanceId: adv.id })}><Icon name="review" /> Review</button>,
            ];
          })}
        />
      </div>
    </>
  );
}

function LedgerPage({ state, user }: { state: AppState; user: User }) {
  const transactions = state.transactions.filter((tx) => tx.userId === user.id);
  const events = state.trustScoreEvents.filter((event) => event.userId === user.id);
  return (
    <>
      <PageHeading title="Ledger and trust history" description="Track funding, fees, repayments, buffer releases, and score changes." />
      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Transaction ledger</h2><span className="badge status-active">{transactions.length} records</span></div>
          <TransactionTimeline transactions={transactions} />
        </div>
        <div className="card card-gold">
          <h2 className="card-title">Trust score events</h2>
          <TrustBreakdown state={state} user={user} />
          <div className="timeline mt-16">
            {events.length === 0 && <p className="soft-text">No trust score events yet.</p>}
            {events.map((event) => (
              <div className="timeline-item" key={event.id}>
                <div className="timeline-dot" style={{ background: getTrustScoreColor(event.newScore) }} />
                <div className="timeline-content">
                  <div className="timeline-type">{event.oldScore} → {event.newScore}</div>
                  <div className="timeline-desc">{event.reason}</div>
                  <div className="timeline-date">{formatDateTime(event.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function CashFlowPage({ state, user, go }: { state: AppState; user: User; go: GoTo }) {
  const invoices = state.invoices.filter((inv) => inv.userId === user.id && inv.status !== 'Paid' && inv.status !== 'Rejected');
  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const potentialAdvance = invoices.reduce((sum, inv) => sum + calculateQuote(user, inv).advanceAmount, 0);
  const estimatedFees = invoices.reduce((sum, inv) => sum + calculateQuote(user, inv).feeAmount, 0);
  const next30 = invoices.filter((inv) => daysUntilDate(inv.dueDate) <= 30).reduce((sum, inv) => sum + inv.amount, 0);
  const cashByWeek = invoices.reduce<{ label: string; total: number }[]>((weeks, invoice) => {
    const due = new Date(`${invoice.dueDate}T12:00:00`);
    const monday = new Date(due);
    monday.setDate(due.getDate() - ((due.getDay() + 6) % 7));
    const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = weeks.find((week) => week.label === label);
    if (existing) existing.total += invoice.amount;
    else weeks.push({ label, total: invoice.amount });
    return weeks;
  }, []);
  return (
    <>
      <PageHeading title="Cash-flow forecast" description="See open receivables and the advance amount available today." />
      <section className="stat-grid">
        <StatCard tone="gold" label="Forecasted receivables" value={formatCurrency(total)} sub={`${invoices.length} open invoices`} />
        <StatCard tone="green" label="Available now" value={formatCurrency(potentialAdvance)} sub="Based on current trust limits" />
        <StatCard tone="amber" label="Estimated fees" value={formatCurrency(estimatedFees)} sub="If all open invoices are advanced" />
        <StatCard tone="blue" label="Current model" value={user.accountType === 'Freelancer' ? 'Discounting' : 'Factoring'} sub={user.accountType === 'Freelancer' ? 'Private client relationship' : 'Client confirmation required'} />
      </section>
      <div className="cash-summary-grid mb-18">
        <div className="cash-summary-card">
          <span>Due in 30 days</span>
          <strong>{formatCurrency(next30)}</strong>
        </div>
        {cashByWeek.map((week) => (
          <div className="cash-summary-card" key={week.label}>
            <span>Week of {week.label}</span>
            <strong>{formatCurrency(week.total)}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        {invoices.length === 0 ? (
          <EmptyPanel title="No open receivables" description="Create an invoice to build a forecast." action={<button className="btn btn-primary btn-sm" onClick={() => go('newInvoice')}><Icon name="plus" /> Create invoice</button>} />
        ) : <>
        <CashFlowChart weeks={cashByWeek} />
        <div className="forecast-list mt-18">
          {invoices.map((invoice) => {
            const quote = calculateQuote(user, invoice);
            const width = Math.min(100, Math.round((invoice.amount / Math.max(total, 1)) * 100));
            return (
              <div className="forecast-row" key={invoice.id}>
                <div className="forecast-main">
                  <button className="link-button" onClick={() => go('invoiceDetail', { invoiceId: invoice.id })}>{invoice.invoiceNumber}</button>
                  <span>{invoice.client.name}</span>
                </div>
                <div className="forecast-bar"><div style={{ width: `${width}%` }} /></div>
                <div className="forecast-meta">
                  <span>{formatCurrency(invoice.amount, invoice.currency)} due {formatDate(invoice.dueDate)}</span>
                  <strong>{formatCurrency(quote.advanceAmount, invoice.currency)} now · {formatCurrency(quote.feeAmount, invoice.currency)} fee</strong>
                </div>
              </div>
            );
          })}
        </div>
        </>}
      </div>
    </>
  );
}

function QuoteCard({ invoice, quote }: { invoice: Invoice; quote: ReturnType<typeof calculateQuote> }) {
  return (
    <div className="quote-box">
      <div className="card-header"><h2 className="card-title">Advance proposal</h2><ModelBadge model={quote.financingModel} /></div>
      <div className="quote-grid">
        <QuoteItem label="Invoice amount" value={formatCurrency(invoice.amount, invoice.currency)} />
        <QuoteItem label="Advance" value={formatCurrency(quote.advanceAmount, invoice.currency)} tone="gold" />
        <QuoteItem label="Flat fee" value={formatCurrency(quote.feeAmount, invoice.currency)} />
        <QuoteItem label="Repayment / settlement" value={formatCurrency(quote.expectedRepaymentAmount, invoice.currency)} tone="green" />
        <QuoteItem label="Settlement buffer" value={formatCurrency(quote.settlementBufferAmount, invoice.currency)} />
        <QuoteItem label="Fee rate" value={`${(quote.feeRate * 100).toFixed(1)}%`} />
      </div>
      <div className="quote-disclaimer">
        Fixed upfront fee. {quote.clientNotificationRequired ? 'Client confirmation is required.' : 'Client is not notified.'}
      </div>
    </div>
  );
}

function CashFlowChart({ weeks }: { weeks: { label: string; total: number }[] }) {
  const max = Math.max(...weeks.map((week) => week.total), 1);
  return (
    <div className="cash-chart">
      <div className="space-between">
        <h2 className="card-title"><Icon name="chart" /> Expected cash by week</h2>
      </div>
      <div className="cash-chart-bars">
        {weeks.map((week) => (
          <div className="cash-chart-row" key={week.label}>
            <span>{week.label}</span>
            <div><strong style={{ width: `${Math.max(8, (week.total / max) * 100)}%` }} /></div>
            <em>{formatCurrency(week.total)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerificationChecklist({ invoice, duplicate, quote }: { invoice: Invoice; duplicate: boolean; quote: ReturnType<typeof calculateQuote> }) {
  const max = quote.maxEligibleInvoiceAmount;
  const checks = [
    { label: 'Supporting document attached', ok: invoice.documents.length > 0 },
    { label: 'Duplicate fingerprint not found', ok: !duplicate },
    { label: `Invoice amount within ${formatCurrency(max, invoice.currency)} limit`, ok: invoice.amount <= max },
    { label: 'Due date is inside the eligible window', ok: new Date(invoice.dueDate).getTime() > Date.now() },
    { label: quote.financingModel === 'InvoiceFactoring' ? 'Client confirmation required for factoring' : 'Client notification skipped for discounting', ok: true },
  ];
  return (
    <div className="verification-list mt-16">
      {checks.map((check) => (
        <div key={check.label} className={`verification-item ${check.ok ? 'ok' : 'bad'}`}>
          <span>{check.ok ? 'OK' : 'Check'}</span>
          <p>{check.label}</p>
        </div>
      ))}
    </div>
  );
}

function ReviewScore({ score, flags }: { score: number; flags: string[] }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="review-score-bar mt-18">
      <div className="space-between"><span className="small-label">Review score</span><strong>{score}/100</strong></div>
      <div className="review-score-track"><div className="review-score-fill" style={{ width: `${score}%`, background: color }} /></div>
      <div className="risk-flags mt-12">
        {flags.length === 0 ? <div className="risk-flag-item success">No high-risk flags detected</div> : flags.map((flag) => <div className="risk-flag-item" key={flag}>{flag}</div>)}
      </div>
    </div>
  );
}

function AiReviewCard({ snapshot }: { snapshot: NonNullable<AppState['aiReviewSnapshots'][number]> }) {
  return (
    <div className="ai-review-card">
      <div className="ai-review-header"><span className="ai-badge">AI Review Assistant</span><StatusBadge status={snapshot.riskLevel === 'Low' ? 'Approved' : snapshot.riskLevel === 'Medium' ? 'PendingReview' : 'Rejected'} /></div>
      <h2 className="card-title">Recommended action: {snapshot.recommendedAction}</h2>
      <p className="ai-review-summary">{snapshot.summary}</p>
      <div className="risk-flags">
        {snapshot.riskFlags.length === 0 ? <div className="risk-flag-item success">No extra risk flags</div> : snapshot.riskFlags.map((flag) => <div key={flag} className="risk-flag-item">{flag}</div>)}
      </div>
    </div>
  );
}

function DecisionSummary({ summary }: { summary: { recommendation: string; tone: 'success' | 'warning' | 'error'; missingItems: string[] } }) {
  return (
    <div className={`decision-summary decision-${summary.tone}`}>
      <div>
        <span className="small-label">Recommended action</span>
        <strong>{summary.recommendation}</strong>
      </div>
      <div>
        <span className="small-label">Required checks</span>
        {summary.missingItems.length === 0 ? (
          <p>No blocking items.</p>
        ) : (
          <ul>
            {summary.missingItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function DemoGuide({ state, currentUser, go }: { state: AppState; currentUser: User; go: GoTo }) {
  const userInvoices = state.invoices.filter((invoice) => invoice.userId === currentUser.id);
  const openInvoice = userInvoices.find((invoice) => !invoice.advanceRequestId && invoice.status !== 'Paid' && invoice.status !== 'Rejected');
  const activeAdvance = state.advanceRequests.find((advance) => advance.userId === currentUser.id && !['Repaid', 'Rejected'].includes(advance.status));
  const pendingReview = state.advanceRequests.find((advance) => advance.status === 'PendingReview');
  let label = 'Create an invoice';
  let description = 'Start with a receivable, then review the available advance.';
  let action = () => go('newInvoice');

  if (state.currentPage === 'adminReview' && pendingReview) {
    label = 'Open pending review';
    description = 'Review score, required checks, and recommended action.';
    action = () => go('adminReview', { advanceId: pendingReview.id });
  } else if (activeAdvance) {
    label = 'Continue advance';
    description = 'Move the active request through funding and settlement.';
    action = () => go('advanceDetail', { advanceId: activeAdvance.id });
  } else if (openInvoice) {
    label = 'Request advance';
    description = 'Use the open invoice to generate a quote.';
    action = () => go('advanceRequest', { invoiceId: openInvoice.id });
  }

  return (
    <div className="demo-guide">
      <div>
        <span className="small-label">Next demo action</span>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button className="btn btn-secondary btn-sm" onClick={action}><Icon name="next" /> Continue</button>
    </div>
  );
}

function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumb-item">
          {item.onClick ? <button onClick={item.onClick}>{item.label}</button> : <strong>{item.label}</strong>}
        </span>
      ))}
    </nav>
  );
}

function SegmentedControl({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="segmented-control mb-18" role="tablist">
      {options.map((option) => (
        <button key={option} className={value === option ? 'active' : ''} onClick={() => onChange(option)} type="button">
          {option}
        </button>
      ))}
    </div>
  );
}

function LifecycleStepper({ status, model }: { status: AdvanceRequest['status']; model: AdvanceRequest['financingModel'] }) {
  const steps =
    model === 'InvoiceFactoring'
      ? [
          { label: 'Requested', statuses: ['PendingReview'] },
          { label: 'Client confirms', statuses: ['PendingClientConfirmation'] },
          { label: 'Approved', statuses: ['Approved'] },
          { label: 'Funded', statuses: ['Disbursed'] },
          { label: 'Client paid', statuses: ['ClientPaidHassil'] },
          { label: 'Settled', statuses: ['Repaid', 'BufferReleased'] },
        ]
      : [
          { label: 'Requested', statuses: ['PendingReview'] },
          { label: 'Approved', statuses: ['Approved'] },
          { label: 'Funded', statuses: ['Disbursed'] },
          { label: 'Payment detected', statuses: ['ClientPaymentDetected'] },
          { label: 'Repaid', statuses: ['Repaid'] },
        ];
  const activeIndex = status === 'Rejected' ? 0 : Math.max(0, steps.findIndex((step) => step.statuses.includes(status)));

  return (
    <div className={`lifecycle ${status === 'Rejected' ? 'lifecycle-rejected' : ''}`}>
      {steps.map((step, index) => (
        <div key={step.label} className={`lifecycle-step ${index < activeIndex ? 'done' : ''} ${index === activeIndex ? 'active' : ''}`}>
          <span>{index < activeIndex ? '✓' : index + 1}</span>
          <strong>{step.label}</strong>
        </div>
      ))}
    </div>
  );
}

function FormFeedback({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (errors.length === 0 && warnings.length === 0) return null;
  return (
    <div className="feedback-list mb-18">
      {errors.map((error) => <div className="feedback-item error" key={error}><Icon name="alert" /> {error}</div>)}
      {warnings.map((warning) => <div className="feedback-item warning" key={warning}><Icon name="alert" /> {warning}</div>)}
    </div>
  );
}

function MockEvidenceUpload({
  invoiceId,
  onUpload,
}: {
  invoiceId: string;
  onUpload: (invoiceId: string, documentType?: string, fileName?: string) => void;
}) {
  const [documentType, setDocumentType] = useState('Purchase Order');
  const [fileName, setFileName] = useState('client-po-and-delivery-note.pdf');
  const [status, setStatus] = useState<'Ready' | 'Uploaded'>('Ready');

  const upload = () => {
    onUpload(invoiceId, documentType, fileName || 'invoice-evidence.pdf');
    setStatus('Uploaded');
    window.setTimeout(() => setStatus('Ready'), 1800);
  };

  return (
    <div className="mock-upload mt-18">
      <div className="space-between">
        <h3>Evidence upload</h3>
        <span className={`badge ${status === 'Uploaded' ? 'status-success' : 'status-draft'}`}>{status}</span>
      </div>
      <div className="form-group mt-12">
        <label>Document type</label>
        <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
          <option>Purchase Order</option>
          <option>Signed Contract</option>
          <option>Delivery Proof</option>
          <option>Platform Payout Proof</option>
          <option>Client Approval Email</option>
        </select>
      </div>
      <div className="form-group">
        <label>File name</label>
        <input value={fileName} onChange={(event) => setFileName(event.target.value)} />
      </div>
      <button className="btn btn-secondary full-width" onClick={upload}><Icon name="upload" /> Upload Evidence</button>
    </div>
  );
}

function EmptyPanel({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="empty-panel">
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="mt-12">{action}</div>}
    </div>
  );
}

function TransactionTimeline({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return <EmptyPanel title="No ledger activity yet" description="Funding, repayment, and score events will appear here." />;
  return (
    <div className="timeline">
      {transactions.map((tx) => (
        <div className="timeline-item" key={tx.id}>
          <div className="timeline-dot" style={{ background: tx.direction === 'Debit' ? 'var(--red)' : tx.direction === 'Credit' ? 'var(--green)' : 'var(--gold)' }} />
          <div className="timeline-content">
            <div className="timeline-type">{transactionLabel(tx.type)} · {tx.direction}</div>
            <div className="timeline-desc">{tx.description}</div>
            <div className="timeline-amount">{tx.type === 'TrustScoreAdjustment' ? `${tx.amount > 0 ? '+' : ''}${tx.amount} score` : formatCurrency(tx.amount)}</div>
            <div className="timeline-date">{formatDateTime(tx.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrustScoreWidget({ score }: { score: number }) {
  return (
    <div className="trust-score-widget">
      <div className="trust-score-label">Trust score</div>
      <div className="trust-score-row">
        <div className="trust-score-value" style={{ color: getTrustScoreColor(score) }}>{score}</div>
        <div className="trust-score-grade">{getTrustScoreLabel(score)}</div>
      </div>
      <div className="trust-bar"><div className="trust-bar-fill" style={{ width: `${score}%`, background: getTrustScoreColor(score) }} /></div>
    </div>
  );
}

function CompactTrustScore({ score }: { score: number }) {
  return (
    <div className="compact-trust" title={`Trust score ${score}/100 · ${getTrustScoreLabel(score)}`}>
      <span>Trust</span>
      <strong style={{ color: getTrustScoreColor(score) }}>{score}</strong>
      <div><i style={{ width: `${score}%`, background: getTrustScoreColor(score) }} /></div>
      <em>{getTrustScoreLabel(score)}</em>
    </div>
  );
}

function TrustBreakdown({ state, user }: { state: AppState; user: User }) {
  const userInvoices = state.invoices.filter((invoice) => invoice.userId === user.id);
  const userAdvances = state.advanceRequests.filter((advance) => advance.userId === user.id);
  const repaid = userAdvances.filter((advance) => advance.status === 'Repaid').length;
  const disputed = userInvoices.filter((invoice) => invoice.status === 'Disputed' || invoice.clientConfirmation?.status === 'Disputed').length;
  const evidenceCoverage = userInvoices.length ? Math.round((userInvoices.filter((invoice) => invoice.documents.length > 0).length / userInvoices.length) * 100) : 0;
  const accountAge = Math.max(1, Math.round((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const rows = [
    ['Repayment history', `${repaid} completed`],
    ['Evidence quality', `${evidenceCoverage}% coverage`],
    ['Disputes', `${disputed} recorded`],
    ['Account age', `${accountAge} days`],
  ];

  return (
    <div className="trust-breakdown mt-16">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function StatCard({ tone, label, value, sub }: { tone: 'gold' | 'green' | 'blue' | 'amber'; label: string; value: string; sub?: string }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className={`stat-icon ${tone}`}>{toneLabel(tone)}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function Table({
  headers,
  rows,
  emptyTitle = 'No records yet',
  emptyDescription = 'Records will appear here when available.',
  emptyAction,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={headers.length}><EmptyPanel title={emptyTitle} description={emptyDescription} action={emptyAction} /></td></tr>}
          {rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} data-label={headers[j]} className={j === 0 ? 'td-primary' : undefined}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function DetailGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="detail-grid">
      {items.map(([label, value]) => (
        <div className="detail-item" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>;
}

function ModelBadge({ model }: { model: AdvanceRequest['financingModel'] }) {
  return <span className={`model-badge ${model === 'InvoiceFactoring' ? 'model-factoring' : 'model-discounting'}`}>{getModelLabel(model)}</span>;
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <div className="page-heading"><h1>{title}</h1><p>{description}</p></div>;
}

function Icon({ name }: { name: 'plus' | 'open' | 'advance' | 'back' | 'next' | 'doc' | 'check' | 'reject' | 'review' | 'alert' | 'upload' | 'chart' }) {
  const paths: Record<typeof name, React.ReactNode> = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    open: <><path d="M7 17 17 7" /><path d="M9 7h8v8" /></>,
    advance: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    back: <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
    next: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    doc: <><path d="M7 3h7l3 3v15H7z" /><path d="M14 3v4h4" /><path d="M9 13h6" /><path d="M9 17h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    reject: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    review: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    alert: <><path d="M12 8v5" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15v-4" /><path d="M12 15V8" /><path d="M16 15v-6" /></>,
  };
  return (
    <svg className="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo-mark clean-button" onClick={onClick}>
      <span className="logo-icon">H</span>
      <span className="logo-text">Has<span>sil</span></span>
    </button>
  );
}

function NavButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{label}</button>;
}

function QuoteItem({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'green' }) {
  return <div><div className="quote-item-label">{label}</div><div className={`quote-item-value ${tone || ''}`}>{value}</div></div>;
}

function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return <div className="card"><h2 className="card-title">{title}</h2><p className="soft-text mt-8">The selected record does not exist.</p><button className="btn btn-primary mt-16" onClick={onAction}>{actionLabel}</button></div>;
}

function EmptyPublicState({ go }: { go: GoTo }) {
  return <main className="confirm-page"><div className="confirm-card"><Logo onClick={() => go('landing')} /><h1 className="card-title mt-16">Client link not found</h1><p className="soft-text mt-8">Create a factoring advance first, then open the confirmation link.</p><button className="btn btn-primary mt-16" onClick={() => go('dashboard')}>Back to dashboard</button></div></main>;
}

function ToastContainer({ toasts }: { toasts: AppState['toasts'] }) {
  return <div className="toast-container">{toasts.map((toast) => <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>)}</div>;
}

function transactionLabel(type: Transaction['type']): string {
  const map: Record<Transaction['type'], string> = {
    AdvanceDisbursement: 'Advance disbursement',
    DetectedIncomingPayment: 'Detected incoming payment',
    UserRepayment: 'User repayment',
    ClientPaymentToHassil: 'Client payment to Hassil',
    PlatformFee: 'Platform fee',
    BufferRelease: 'Buffer release',
    TrustScoreAdjustment: 'Trust score adjustment',
  };
  return map[type];
}

function sourceLabel(source: Invoice['receivableSource']): string {
  return source === 'DirectClientInvoice' ? 'Direct client invoice' : 'Freelance platform payout';
}

function toneLabel(tone: 'gold' | 'green' | 'blue' | 'amber') {
  return { gold: '01', green: '02', blue: '03', amber: '04' }[tone];
}

function getAdminReviewSummary(advance: AdvanceRequest, invoice: Invoice, flags: string[]) {
  const missingItems = [
    invoice.documents.length === 0 ? 'Supporting evidence' : '',
    advance.clientNotificationRequired && invoice.clientConfirmation?.status !== 'Confirmed' ? 'Client confirmation' : '',
    advance.reviewScore < 75 ? 'Reviewer approval for score below auto-approve threshold' : '',
    ...flags.filter((flag) => !['Supporting document is missing', 'Client confirmation is still pending'].includes(flag)),
  ].filter((item): item is string => Boolean(item));

  if (advance.status === 'Rejected') return { recommendation: 'Reject', tone: 'error' as const, missingItems };
  if (missingItems.length > 0) return { recommendation: 'Request more info', tone: 'warning' as const, missingItems };
  return { recommendation: 'Approve', tone: 'success' as const, missingItems };
}

function buildRouteHash(page: PageName, params: Record<string, string> = {}) {
  const pathMap: Partial<Record<PageName, string>> = {
    landing: '/',
    selectType: '/select-type',
    dashboard: '/dashboard',
    invoices: '/invoices',
    newInvoice: '/invoices/new',
    adminReview: params.advanceId ? `/admin/advances/${params.advanceId}` : '/admin',
    ledger: '/ledger',
    cashFlow: '/cash-flow',
    clientConfirmation: `/client/confirm/${params.token || ''}`,
    invoiceDetail: `/invoices/${params.invoiceId || ''}`,
    advanceRequest: `/invoices/${params.invoiceId || ''}/advance`,
    advanceDetail: `/advances/${params.advanceId || ''}`,
    onboarding: `/onboarding/${params.type || 'SmallBusiness'}`,
  };
  return `#${pathMap[page] || '/'}`;
}

function parseRouteHash(hash: string): Pick<AppState, 'currentPage' | 'pageParams'> {
  const path = (hash.replace(/^#/, '') || '/').replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (path === '/') return { currentPage: 'landing', pageParams: {} };
  if (path === '/select-type') return { currentPage: 'selectType', pageParams: {} };
  if (path === '/dashboard') return { currentPage: 'dashboard', pageParams: {} };
  if (path === '/invoices') return { currentPage: 'invoices', pageParams: {} };
  if (path === '/invoices/new') return { currentPage: 'newInvoice', pageParams: {} };
  if (parts[0] === 'invoices' && parts[1] && parts[2] === 'advance') return { currentPage: 'advanceRequest', pageParams: { invoiceId: parts[1] } };
  if (parts[0] === 'invoices' && parts[1]) return { currentPage: 'invoiceDetail', pageParams: { invoiceId: parts[1] } };
  if (parts[0] === 'advances' && parts[1]) return { currentPage: 'advanceDetail', pageParams: { advanceId: parts[1] } };
  if (parts[0] === 'client' && parts[1] === 'confirm' && parts[2]) return { currentPage: 'clientConfirmation', pageParams: { token: parts[2] } };
  if (path === '/admin') return { currentPage: 'adminReview', pageParams: {} };
  if (parts[0] === 'admin' && parts[1] === 'advances' && parts[2]) return { currentPage: 'adminReview', pageParams: { advanceId: parts[2] } };
  if (path === '/ledger') return { currentPage: 'ledger', pageParams: {} };
  if (path === '/cash-flow') return { currentPage: 'cashFlow', pageParams: {} };
  if (parts[0] === 'onboarding') return { currentPage: 'onboarding', pageParams: { type: parts[1] || 'SmallBusiness' } };
  return { currentPage: 'landing', pageParams: {} };
}

export default App;
