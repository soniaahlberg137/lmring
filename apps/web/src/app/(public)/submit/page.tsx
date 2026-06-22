import { SubmitAgentForm } from '@/components/submit/SubmitAgentForm';

export const metadata = {
  title: 'Submit an Agent',
};

export default function SubmitPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit an Agent</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Submit your assembled agent to be benchmarked across multiple model backends.
        </p>
      </div>
      <SubmitAgentForm />
    </div>
  );
}
