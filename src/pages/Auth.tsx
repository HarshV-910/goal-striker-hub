import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Target, Eye, EyeOff } from 'lucide-react';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInForm, setIsMouseInForm] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mouse tracking for robot eyes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Calculate eye position based on mouse position
      const robotCenter = { x: 250, y: window.innerHeight / 2 };
      const angle = Math.atan2(e.clientY - robotCenter.y, e.clientX - robotCenter.x);
      const distance = Math.min(8, Math.sqrt(Math.pow(e.clientX - robotCenter.x, 2) + Math.pow(e.clientY - robotCenter.y, 2)) / 50);
      
      setEyePosition({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, formData.fullName);
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: isLogin ? "Welcome back!" : "Account created successfully!",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220_30%_5%)] via-[hsl(260_40%_10%)] to-[hsl(240_50%_8%)] flex items-center relative overflow-hidden">
      {/* Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h2 className="text-8xl md:text-9xl font-bold text-white/10 select-none font-['Permanent_Marker'] tracking-widest">
          No Distraction
        </h2>
      </div>

      {/* Robot Character */}
      <div className="absolute left-8 md:left-16 top-1/2 transform -translate-y-1/2 z-10">
        <div className="relative w-32 h-40 md:w-40 md:h-48">
          {/* Robot Body */}
          <div className="absolute bottom-0 w-20 h-24 md:w-24 md:h-28 bg-gradient-to-b from-slate-300 to-slate-400 rounded-lg border-4 border-slate-500 mx-auto left-1/2 transform -translate-x-1/2">
            {/* Body details */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="absolute top-6 left-2 w-2 h-2 bg-slate-600 rounded"></div>
            <div className="absolute top-6 right-2 w-2 h-2 bg-slate-600 rounded"></div>
          </div>
          
          {/* Robot Head */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-20 md:w-28 md:h-24 bg-gradient-to-b from-slate-200 to-slate-300 rounded-xl border-4 border-slate-500">
            {/* Eyes */}
            <div className="absolute top-3 left-3 w-6 h-6 md:w-7 md:h-7 bg-white rounded-full border-2 border-slate-600 overflow-hidden">
              <div 
                className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100"
                style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}
              ></div>
            </div>
            <div className="absolute top-3 right-3 w-6 h-6 md:w-7 md:h-7 bg-white rounded-full border-2 border-slate-600 overflow-hidden">
              <div 
                className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100"
                style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}
              ></div>
            </div>
            
            {/* Mouth */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-slate-600 rounded-full"></div>
          </div>
          
          {/* Antennas */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-0.5 h-6 bg-slate-400 mx-auto"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
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
          <span className="text-white font-bold text-lg drop-shadow-lg font-['Permanent_Marker']">
            Concentration
          </span>
        </div>
      )}

      {/* Auth Form - Moved to right side */}
      <div className="ml-auto mr-8 md:mr-16 w-full max-w-md animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 glass-card rounded-full mb-4 animate-bounce-in">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Striker
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your goals, achieve your dreams
          </p>
        </div>

        <Card 
          className="glass-card shadow-2xl border-0 backdrop-blur-md bg-white/70 border border-white/20 relative overflow-hidden"
          onMouseEnter={() => setIsMouseInForm(true)}
          onMouseLeave={() => setIsMouseInForm(false)}
        >
          {/* Glass reflection effect */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
          
          <CardHeader className="text-center relative z-10">
            <CardTitle className="text-2xl text-slate-800">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {isLogin 
                ? 'Sign in to continue tracking your goals' 
                : 'Create your account to start your journey'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required={!isLogin}
                    className="transition-all duration-200 focus:scale-105 bg-white/50 border-white/30 text-slate-800 placeholder:text-slate-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="transition-all duration-200 focus:scale-105 bg-white/50 border-white/30 text-slate-800 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="transition-all duration-200 focus:scale-105 pr-10 bg-white/50 border-white/30 text-slate-800 placeholder:text-slate-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-slate-600 hover:text-slate-800"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6 transition-all duration-200 hover:scale-105 hover:shadow-lg bg-slate-800 hover:bg-slate-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;