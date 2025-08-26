import { useState, useEffect } from 'react';
import { Clock, Globe, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

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
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  return (
    <header className="bg-card border-b border-border px-6 py-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Striker
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Date/Time Display */}
          <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
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
              <Button variant="outline" size="icon" className="hover:scale-105 transition-transform">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="animate-fade-in">
              <DropdownMenuItem className="text-sm text-muted-foreground">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};