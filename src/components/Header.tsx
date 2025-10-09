import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Globe, User, LogOut, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
];

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut, deleteAccount } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch user's timezone from profile
    if (user) {
      fetchUserTimezone();
      
      // Subscribe to profile changes for real-time avatar and timezone updates (both INSERT and UPDATE)
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newData = payload.new as any;
            if (newData?.avatar_url !== undefined) {
              setAvatarUrl(newData.avatar_url);
            }
            if (newData?.full_name) {
              setFullName(newData.full_name);
            }
            if (newData?.timezone) {
              setSelectedTimezone(newData.timezone);
            }
          }
        )
        .subscribe();

      return () => {
        clearInterval(timer);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(timer);
  }, [user]);

  const fetchUserTimezone = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('timezone, avatar_url, full_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.timezone) {
        setSelectedTimezone(data.timezone);
      }
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
      if (data?.full_name) {
        setFullName(data.full_name);
      }
    } catch (error) {
      console.error('Error fetching user timezone:', error);
    }
  };

  const formatTime = (date: Date, timezone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return format(date, 'PPp');
    }
  };

  const handleDeleteAccount = async () => {
    const { error } = await deleteAccount();
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
    }
    
    setShowDeleteDialog(false);
  };

  return (
    <header className="glass-card border-b border-border px-6 py-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-foreground">
              Striker
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Date/Time Display */}
          <div className="flex items-center space-x-2 glass-subtle px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatTime(currentTime, selectedTimezone)}
            </span>
          </div>

          {/* Timezone Selector */}
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger className="w-[180px]">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:scale-105 transition-transform">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} alt="Profile" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="animate-fade-in">
              <DropdownMenuItem className="text-sm text-muted-foreground">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data including goals, daily logs, and personal information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};