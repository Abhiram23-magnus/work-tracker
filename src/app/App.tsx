import { useRoute } from './routes'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { WorkersPage } from '../pages/WorkersPage'
import { WorkerProfilePage } from '../pages/WorkerProfilePage'
import { HistoryPage } from '../pages/HistoryPage'

export default function App() {
  const route = useRoute()
  return (
    <AppLayout route={route}>
      {route.name === 'dashboard' && <DashboardPage />}
      {route.name === 'workers' && <WorkersPage />}
      {route.name === 'worker' && <WorkerProfilePage id={route.id} />}
      {route.name === 'history' && <HistoryPage />}
    </AppLayout>
  )
}
