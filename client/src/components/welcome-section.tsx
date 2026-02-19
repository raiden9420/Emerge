import { User } from '@/lib/types';

type WelcomeSectionProps = {
  username: string;
};

export function WelcomeSection({ username }: WelcomeSectionProps) {
  return (
    <div className="flex items-center gap-4 p-6 bg-card rounded-lg">
      <div>
        <h2 className="text-2xl font-semibold">
          Welcome back, {username}!
        </h2>
      </div>
    </div>
  );
}
