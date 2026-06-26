import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-8xl font-black text-primary/20 mb-4">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
