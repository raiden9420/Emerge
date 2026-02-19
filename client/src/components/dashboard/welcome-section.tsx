import { User } from '@/lib/types';

type WelcomeSectionProps = {
  username: string;
};

export function WelcomeSection({ username }: WelcomeSectionProps) {
  return (
    <div className="flex items-center gap-4 p-6 bg-card rounded-lg border border-border">
      <div>
        <h2 className="text-2xl font-semibold">
          Welcome back, {username}!
        </h2>
        <p className="mt-2 text-muted-foreground">
          Continue your progress toward your career goals. Track your learning journey below.
        </p>
      </div>
    </div>
  );
}
