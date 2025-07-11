
import { WirePaymentDashboard } from '../components/wire-payment-dashboard'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WirePaymentDashboard />
    </div>
  )
}
