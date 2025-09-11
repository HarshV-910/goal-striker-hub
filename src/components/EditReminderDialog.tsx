import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditReminderDialogProps {
  goalId: string;
  currentReminders: string[] | null;
  onReminderUpdated: () => void;
}

const reminderOptions = [
  { id: '15min', label: 'Before 15 minutes' },
  { id: '30min', label: 'Before 30 minutes' },
  { id: '1hour', label: 'Before 1 hour' },
  { id: '1day', label: 'Before 1 day' },
  { id: '3days', label: 'Before 3 days' },
  { id: '7days', label: 'Before 7 days' },
  { id: '1month', label: 'Before 1 month' },
  { id: '3months', label: 'Before 3 months' },
];

export function EditReminderDialog({ goalId, currentReminders, onReminderUpdated }: EditReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<string[]>(currentReminders || []);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReminderToggle = (reminderId: string) => {
    setSelectedReminders(prev => 
      prev.includes(reminderId) 
        ? prev.filter(id => id !== reminderId)
        : [...prev, reminderId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          reminder_options: selectedReminders.length > 0 ? selectedReminders : null,
        })
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reminders updated successfully!",
      });

      setOpen(false);
      onReminderUpdated();
    } catch (error) {
      console.error('Error updating reminders:', error);
      toast({
        title: "Error",
        description: "Failed to update reminders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Reminders
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Reminders</DialogTitle>
          <DialogDescription>
            Choose when you want to be reminded about this goal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <Label>Reminder Options</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {reminderOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedReminders.includes(option.id)}
                    onCheckedChange={() => handleReminderToggle(option.id)}
                  />
                  <Label htmlFor={option.id} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedReminders.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedReminders.length} reminder{selectedReminders.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}