import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Target, Eye, EyeOff } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (UTC-5)' },
  { value: 'America/Chicago', label: 'Central Time (UTC-6)' },
  { value: 'America/Denver', label: 'Mountain Time (UTC-7)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (UTC+5:30)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (UTC+8)' },
];

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInForm, setIsMouseInForm] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [showOTP, setShowOTP] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    timezone: 'UTC',
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mouse tracking for robot eyes - improved 360 degree movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Calculate eye position based on mouse position - improved calculation
      const robotCenter = { 
        x: window.innerWidth * 0.15, // Approximate robot position
        y: window.innerHeight / 2 
      };
      
      // Calculate distance and angle from robot center to mouse
      const deltaX = e.clientX - robotCenter.x;
      const deltaY = e.clientY - robotCenter.y;
      const angle = Math.atan2(deltaY, deltaX);
      const maxDistance = 6; // Maximum eye movement distance
      
      // Calculate eye position with proper 360-degree movement
      setEyePosition({
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTPEmail = async (email: string, otp: string, type: 'signup' | 'reset', name?: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, otp, type, name }
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login without OTP
        const result = await signIn(formData.email, formData.password);
        if (result.error) {
          toast({
            title: "Error",
            description: result.error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Welcome back!",
          });
          navigate('/dashboard');
        }
      } else {
        // Signup with OTP
        const otp = generateOTP();
        setGeneratedOTP(otp);
        
        const emailResult = await sendOTPEmail(formData.email, otp, 'signup', formData.fullName);
        if (emailResult.success) {
          setShowOTP(true);
          toast({
            title: "OTP Sent",
            description: "Please check your email for the verification code.",
          });
        } else {
          throw new Error('Failed to send OTP email');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (otpValue !== generatedOTP) {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(formData.email, formData.password, formData.fullName, formData.timezone);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Error",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const otp = generateOTP();
      setGeneratedOTP(otp);
      
      const emailResult = await sendOTPEmail(formData.email, otp, 'reset');
      if (emailResult.success) {
        setShowForgotPassword(true);
        setShowOTP(true);
        toast({
          title: "Reset Code Sent",
          description: "Please check your email for the password reset code.",
        });
      } else {
        throw new Error('Failed to send reset email');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (otpValue !== generatedOTP) {
      toast({
        title: "Error",
        description: "Invalid reset code. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Please enter a new password (minimum 6 characters).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update password in Supabase auth.users table
      const { data, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) throw listError;
      
      const targetUser = data?.users?.find((u: any) => u.email === formData.email);
      
      if (!targetUser) {
        throw new Error('User not found');
      }

      const { error } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        { password: formData.password }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset successfully! Please login with your new password.",
      });
      
      // Reset form
      setShowForgotPassword(false);
      setShowOTP(false);
      setOtpValue('');
      setFormData({ ...formData, password: '' });
      setIsLogin(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220_30%_5%)] via-[hsl(260_40%_10%)] to-[hsl(240_50%_8%)] flex items-center relative overflow-hidden">
      {/* Background Text - With padding to cover 85% width and 70% height */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-[7.5%] py-[15%]">
        <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white/80 select-none font-orbitron tracking-widest">
          No Distraction
        </h2>
      </div>

      {/* Robot Eyes - Positioned at bottom left corner with margin */}
      <div className="absolute bottom-8 left-8 z-10 opacity-70">
        <div className="relative w-32 h-20 md:w-40 md:h-24 lg:w-48 lg:h-28">
          {/* Robot Eyes with cute eyebrows - 2x larger */}
          
          {/* Left Eye with Eyebrow */}
          <div className="absolute top-0 left-0">
            {/* Cute Eyebrow */}
            <div className="absolute -top-3 left-1 w-8 h-2 md:w-10 md:h-3 lg:w-12 lg:h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-full transform -rotate-12 shadow-sm"></div>
            
            {/* Eye */}
            <div className="w-12 h-12 md:w-14 md:h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-full shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.8)] border-2 lg:border-4 border-gray-600/50 overflow-hidden">
              <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-black rounded-full">
                <div 
                  className="w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-700 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  style={{ transform: `translate(calc(-50% + ${eyePosition.x}px), calc(-50% + ${eyePosition.y}px))` }}
                >
                  <div className="absolute top-1 left-1 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-white rounded-full opacity-80"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Eye with Eyebrow */}
          <div className="absolute top-0 right-0">
            {/* Cute Eyebrow */}
            <div className="absolute -top-3 right-1 w-8 h-2 md:w-10 md:h-3 lg:w-12 lg:h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-full transform rotate-12 shadow-sm"></div>
            
            {/* Eye */}
            <div className="w-12 h-12 md:w-14 md:h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-full shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.8)] border-2 lg:border-4 border-gray-600/50 overflow-hidden">
              <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-black rounded-full">
                <div 
                  className="w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-700 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  style={{ transform: `translate(calc(-50% + ${eyePosition.x}px), calc(-50% + ${eyePosition.y}px))` }}
                >
                  <div className="absolute top-1 left-1 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-white rounded-full opacity-80"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Concentration Text */}
      {!isMouseInForm && (
        <div 
          className="fixed pointer-events-none z-50 transition-all duration-200"
          style={{ 
            left: mousePosition.x + 20, 
            top: mousePosition.y - 30,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span className="text-white font-bold text-lg drop-shadow-lg font-orbitron">
            concentrate...
          </span>
        </div>
      )}

      {/* Auth Form - Centered vertically and horizontally */}
      <div className="ml-auto mr-8 md:mr-16 w-full max-w-md animate-fade-in flex flex-col justify-center min-h-screen">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white">
            Striker
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your goals, achieve your dreams
          </p>
        </div>

        <Card 
          className="shadow-2xl backdrop-blur-xl bg-blue-500/2 border border-white/5 relative overflow-hidden opacity-50 hover:opacity-95 focus-within:opacity-95 transition-opacity duration-300"
          onMouseEnter={() => setIsMouseInForm(true)}
          onMouseLeave={() => setIsMouseInForm(false)}
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02), rgba(147, 197, 253, 0.01))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(59, 130, 246, 0.05)'
          }}
        >
          {/* Glass reflection effects */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none"></div>
          <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/5 rounded-full blur-lg pointer-events-none"></div>
          
          <CardHeader className="text-center relative z-10">
            <CardTitle className="text-2xl text-white font-bold drop-shadow-lg">
              {showOTP 
                ? (showForgotPassword ? 'Reset Password' : 'Verify Email') 
                : (isLogin ? 'Welcome Back' : 'Get Started')
              }
            </CardTitle>
            <CardDescription className="text-white/80">
              {showOTP 
                ? (showForgotPassword ? 'Enter the code sent to your email and new password' : 'Enter the verification code sent to your email')
                : (isLogin 
                  ? 'Sign in to continue tracking your goals' 
                  : 'Create your account to start your journey'
                )
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10">
            {showOTP ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP value={otpValue} onChange={setOtpValue} maxLength={6}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="bg-white/20 border-white/30 text-white" />
                        <InputOTPSlot index={1} className="bg-white/20 border-white/30 text-white" />
                        <InputOTPSlot index={2} className="bg-white/20 border-white/30 text-white" />
                        <InputOTPSlot index={3} className="bg-white/20 border-white/30 text-white" />
                        <InputOTPSlot index={4} className="bg-white/20 border-white/30 text-white" />
                        <InputOTPSlot index={5} className="bg-white/20 border-white/30 text-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-white/60 text-sm text-center">
                    Enter the 6-digit code sent to {formData.email}
                  </p>
                </div>

                {showForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white font-medium">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="transition-all duration-200 focus:scale-105 pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={showForgotPassword ? handlePasswordReset : handleOTPVerification}
                  className="w-full transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                  disabled={isLoading || otpValue.length !== 6}
                >
                  {isLoading ? 'Verifying...' : (showForgotPassword ? 'Reset Password' : 'Verify Email')}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => {
                      setShowOTP(false);
                      setShowForgotPassword(false);
                      setOtpValue('');
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Back to {isLogin ? 'login' : 'signup'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white font-medium">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required={!isLogin}
                        className="transition-all duration-200 focus:scale-105 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="transition-all duration-200 focus:scale-105 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="transition-all duration-200 focus:scale-105 pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-white font-medium">Timezone</Label>
                      <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue placeholder="Select your timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full mt-6 transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Send Verification Code')}
                  </Button>
                </form>

                <div className="mt-6 space-y-3 text-center">
                  {isLogin && (
                    <Button
                      variant="link"
                      onClick={handleForgotPassword}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      Forgot your password?
                    </Button>
                  )}
                  
                  <Button
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;