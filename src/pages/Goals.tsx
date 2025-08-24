import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Goals = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Goals</h1>
        <p className="text-muted-foreground">Manage and track your goals</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
          <CardDescription>Create and manage your personal and professional goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Goals management feature coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;