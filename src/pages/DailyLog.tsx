import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DailyLog = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Log</h1>
        <p className="text-muted-foreground">Track your daily progress and activities</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Log</CardTitle>
          <CardDescription>Record your daily activities and progress towards your goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Daily logging feature coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyLog;