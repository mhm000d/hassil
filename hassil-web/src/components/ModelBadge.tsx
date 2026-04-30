import type { FinancingModel } from '../types'
import { getModelLabel } from '../utils/formatters'

export default function ModelBadge({ model }: { model: FinancingModel }) {
    return (
        <span className={`model-badge ${model === 'InvoiceFactoring' ? 'model-factoring' : 'model-discounting'}`}>
            {getModelLabel(model)}
        </span>
    )
}
