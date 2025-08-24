import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Calendar = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">View your goals and activities in calendar format</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Goal Calendar</CardTitle>
          <CardDescription>Visualize your goals and deadlines on a calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Calendar view feature coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;