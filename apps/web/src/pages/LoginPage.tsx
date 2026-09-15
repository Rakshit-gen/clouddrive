import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getGoogleLoginUrl } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { DriveLogo } from '@/components/DriveLogo';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const authFailed = searchParams.get('error') === 'auth_failed';

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mb-6 flex justify-center">
          <DriveLogo className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-medium">Sign in to Drive</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your Google account to store and manage your files.
        </p>

        {authFailed && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Sign-in didn't go through. Please try again.
          </p>
        )}

        <Button asChild className="mt-6 w-full" size="lg">
          <a href={getGoogleLoginUrl()}>Continue with Google</a>
        </Button>
      </div>
    </div>
  );
}
