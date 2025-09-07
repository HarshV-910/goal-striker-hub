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
      {/* Background Text - With padding to cover 75% width and 50% height */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-[12.5%] py-[25%]">
        <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white/80 select-none font-orbitron tracking-widest">
          No Distraction
        </h2>
      </div>

      {/* 3D Robot Face - Positioned at left side with double size */}
      <div className="absolute top-1/2 left-16 transform -translate-y-1/2 z-10">
        <div className="relative w-40 h-40 md:w-48 md:h-48 lg:w-64 lg:h-64">
          {/* Robot Face - Enhanced 3D with gradients, sized relative to text */}
          <div className="w-full h-full bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 rounded-full shadow-[0_25px_50px_-12px_rgba(59,130,246,0.5),inset_0_4px_6px_-1px_rgba(255,255,255,0.4)] border-4 border-blue-300/30 relative overflow-hidden">
            {/* 3D Face Shadow and highlights */}
            <div className="absolute inset-2 bg-gradient-to-br from-white/20 via-transparent to-blue-400/30 rounded-full"></div>
            <div className="absolute top-2 left-4 w-8 h-8 lg:w-12 lg:h-12 bg-white/30 rounded-full blur-xl"></div>
            <div className="absolute bottom-2 right-4 w-6 h-6 lg:w-8 lg:h-8 bg-blue-400/20 rounded-full blur-lg"></div>
            
            {/* Large 3D Eyes with enhanced effects - responsive sizing */}
            <div className="absolute top-2 left-2 w-6 h-6 md:w-7 md:h-7 lg:w-10 lg:h-10 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-full shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.8)] border-2 lg:border-4 border-gray-600/50 overflow-hidden">
              <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-black rounded-full">
                <div 
                  className="w-3 h-3 md:w-4 md:h-4 lg:w-6 lg:h-6 bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-700 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  style={{ transform: `translate(calc(-50% + ${eyePosition.x}px), calc(-50% + ${eyePosition.y}px))` }}
                >
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white/90 rounded-full shadow-sm"></div>
                  <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white/50 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2 w-6 h-6 md:w-7 md:h-7 lg:w-10 lg:h-10 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-full shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.8)] border-2 lg:border-4 border-gray-600/50 overflow-hidden">
              <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-black rounded-full">
                <div 
                  className="w-3 h-3 md:w-4 md:h-4 lg:w-6 lg:h-6 bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-700 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  style={{ transform: `translate(calc(-50% + ${eyePosition.x}px), calc(-50% + ${eyePosition.y}px))` }}
                >
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white/90 rounded-full shadow-sm"></div>
                  <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white/50 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Enhanced mouth with 3D effect - responsive */}
            <div className="absolute bottom-3 lg:bottom-6 left-1/2 transform -translate-x-1/2 w-3 h-1.5 lg:w-4 lg:h-2 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-gray-700"></div>
            
            {/* Additional 3D highlights - responsive */}
            <div className="absolute top-1 left-3 lg:top-3 lg:left-6 w-3 h-3 lg:w-4 lg:h-4 bg-white/50 rounded-full blur-sm"></div>
            <div className="absolute top-3 right-4 lg:top-6 lg:right-8 w-2 h-2 lg:w-3 lg:h-3 bg-blue-200/60 rounded-full blur-sm"></div>
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
          <h1 className="text-3xl font-bold text-white">
            Striker
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your goals, achieve your dreams
          </p>
        </div>

        <Card 
          className="shadow-2xl backdrop-blur-xl bg-blue-500/2 border border-white/5 relative overflow-hidden opacity-50"
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
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </CardTitle>
            <CardDescription className="text-white/80">
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

              <Button 
                type="submit" 
                className="w-full mt-6 transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="mt-6 text-center">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;