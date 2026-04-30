type StarterAccountType = 'SmallBusiness' | 'Freelancer'

function uniqueToken() {
    const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    return `${Date.now().toString(36)}${random}`.toLowerCase()
}

export function createFreelancerStarterData() {
    const token = uniqueToken()
    return {
        accountType: 'Freelancer' as StarterAccountType,
        fullName: 'Mona Ahmed',
        name: 'Mona Ahmed',
        email: `mona.${token}@monaux.co`,
        phone: '+20 100 771 8821',
        country: 'Egypt',
        bankName: 'Mona Ahmed',
        bankLast4: '7781',
    }
}

export function createSmallBusinessStarterData() {
    const token = uniqueToken()
    return {
        accountType: 'SmallBusiness' as StarterAccountType,
        businessName: 'Cairo Visual Works',
        name: 'Cairo Visual Works',
        registrationNumber: `EG-C-${token.slice(-8).toUpperCase()}`,
        email: `finance.${token}@cairovisual.co`,
        phone: '+20 100 482 1190',
        country: 'Egypt',
        bankName: 'Cairo Visual Works LLC',
        bankLast4: '4481',
    }
}

export function createStarterData(accountType: StarterAccountType) {
    return accountType === 'Freelancer'
        ? createFreelancerStarterData()
        : createSmallBusinessStarterData()
}
