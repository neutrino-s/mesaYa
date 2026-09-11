import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { queryClient } from '@/lib/queryClient'
import { AppRouter } from '@/routes/AppRouter'

function App() {
  useAuthSession()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
