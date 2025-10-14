import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MyResultsShow({ response }: { response: any }) {
  const avg = response.question_responses.length
    ? (
        response.question_responses.reduce((acc: number, r: any) => acc + (r.score || 0), 0) /
        response.question_responses.length
      ).toFixed(2)
    : null;

  return (
    <AppLayout>
      <Head title="Evaluation Result" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card className="max-w-3xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Summary</CardTitle>
            <CardAction>
              <Link href={'/my-results'}>
                <Button variant={'default'}>Go Back</Button>
              </Link>
            </CardAction>
          </CardHeader>
          <hr />
          <CardContent>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <div>Evaluation Period: {response.evaluation_period || 'N/A'}</div>
              <div>
                Evaluation Type:{' '}
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  response.evaluation_type === 'Personal' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {response.evaluation_type}
                </span>
              </div>
              <div>Average Score: {avg ?? 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Question Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {response.question_responses.map((qr: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between rounded border p-3">
                  <div className="pr-4">{qr.question_text}</div>
                  <div className="font-medium">{qr.score}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


