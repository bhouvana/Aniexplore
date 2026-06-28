import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={this.reset} variant="outline" className="border-white/20">
              Try again
            </Button>
            <Button onClick={() => (window.location.href = "/")} className="bg-primary hover:bg-primary/90">
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
