import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AnimeBrowse from "@/pages/AnimeBrowse";
import AnimeDetail from "@/pages/AnimeDetail";
import WatchPage from "@/pages/WatchPage";
import MangaBrowse from "@/pages/MangaBrowse";
import MangaDetail from "@/pages/MangaDetail";
import MangaReader from "@/pages/MangaReader";
import Layout from "@/components/layout/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/anime" component={AnimeBrowse} />
        <Route path="/anime/:id" component={AnimeDetail} />
        <Route path="/watch/:id/:season/:episode" component={WatchPage} />
        <Route path="/manga" component={MangaBrowse} />
        <Route path="/manga/read/:id/:chapterId" component={MangaReader} />
        <Route path="/manga/:id" component={MangaDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "hsl(222 47% 7%)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "hsl(210 40% 96%)",
              },
            }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
