import { Button } from "../../src/components/ui/button";
import { Card, CardContent } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  Globe, 
  Volume2, 
  Shield, 
  Zap, 
  Lock,
  Users,
  Heart,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

const HomePage = () => {
  const router = useRouter();
  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Speech Recognition (STT)",
      description: "Medical-grade accuracy using Whisper AI. Patients, nurses, and doctors can speak naturally without typing.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Real-Time Translation",
      description: "Instantly translates speech into preferred languages. Break down language barriers in healthcare.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Volume2 className="w-8 h-8" />,
      title: "Natural Voice Playback (TTS)",
      description: "Human-like voices using ElevenLabs technology. Recipients hear conversations naturally in their language.",
      gradient: "from-teal-500 to-green-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Role-Based Security",
      description: "Separate secure flows for patients, nurses, and admins. Each role has tailored access and dashboards.",
      gradient: "from-indigo-500 to-blue-500"
    }
  ];

  const benefits = [
    {
      icon: <Zap className="w-6 h-6 text-medical-blue" />,
      title: "Low Latency & Reliability",
      description: "Optimized for fast communication, crucial in medical emergencies."
    },
    {
      icon: <Lock className="w-6 h-6 text-medical-blue" />,
      title: "Privacy & Compliance", 
      description: "Built with HIPAA-like regulations. Patient data is encrypted and secure."
    },
    {
      icon: <Users className="w-6 h-6 text-medical-blue" />,
      title: "Multi-Role Support",
      description: "Designed for patients, nurses, doctors, and administrative staff."
    },
    {
      icon: <Heart className="w-6 h-6 text-medical-blue" />,
      title: "Healthcare-Focused",
      description: "Purpose-built for medical environments with specialized terminology support."
    }
  ];

  const stats = [
    { number: "99.9%", label: "Accuracy Rate", suffix: "" },
    { number: "40+", label: "Languages", suffix: "" }, 
    { number: "<100ms", label: "Response Time", suffix: "" },
    { number: "HIPAA", label: "Compliant", suffix: "" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/20 to-purple-50/20">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              VoiceCare
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors">Features</a>
            <a href="#benefits" className="text-foreground hover:text-primary transition-colors">Benefits</a>
            <a href="#security" className="text-foreground hover:text-primary transition-colors">Security</a>
            <Button variant="hero" size="sm" onClick={() => router.push('/auth/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-gradient-primary/10 text-primary border-primary/20">
                Healthcare AI Communication
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Break Language{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Barriers
                </span>{' '}
                in Healthcare
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                VoiceCare removes communication obstacles between patients, nurses, and admins using 
                real-time speech recognition, translation, and natural voice playback.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="group"
                onClick={() => router.push('/auth/login')}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="group">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="text-2xl font-bold text-primary ">{stat.number}</div>
                  <div className="text-sm text-muted-foreground ">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden shadow-feature">
            <div className="relative w-full h-[400px]">
              <Image 
                src="/healthcare.jpeg" 
                alt="Healthcare professionals communicating across languages"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center animate-float">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
              <Globe className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-fade-in-up">
          <Badge variant="secondary" className="mb-4">Core Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful AI Communication Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every feature designed specifically for healthcare environments with medical-grade accuracy and reliability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-feature transition-all duration-300 animate-fade-in" style={{animationDelay: `${index * 0.2}s`}}>
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="bg-gradient-card py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Healthcare Teams Choose VoiceCare
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for medical environments with enterprise-grade security and compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-4 animate-fade-in" style={{animationDelay: `${index * 0.15}s`}}>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section id="security" className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Security & Compliance
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Built for Healthcare{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Privacy Standards
              </span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              VoiceCare is designed with healthcare regulations in mind, ensuring patient data 
              remains encrypted, secure, and compliant with industry standards.
            </p>
            
            <div className="space-y-4">
              {[
                "End-to-end encryption for all voice data",
                "HIPAA-compliant data handling",
                "Role-based access controls",
                "Audit trails for all interactions",
                "On-premises deployment options"
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <Button variant="medical" size="lg" className="mt-6">
              Learn About Security
            </Button>
          </div>

          <div className="relative animate-scale-in">
            <Card className="p-8 shadow-feature">
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                  <p className="text-muted-foreground">
                    Bank-level encryption and security protocols protect sensitive healthcare communications.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">256-bit</div>
                    <div className="text-sm text-green-700">Encryption</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">99.9%</div>
                    <div className="text-sm text-blue-700">Uptime SLA</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary py-20">
        <div className="container mx-auto px-6 text-center animate-fade-in-up">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Transform Healthcare Communication?
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Join forward-thinking healthcare organizations using VoiceCare to break down language barriers 
              and improve patient care through AI-powered communication.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 hover:text-primary"
                onClick={() => router.push('/auth/login')}
              >
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="border-white text-black hover:bg-white/10 hover:text-white">
                Schedule Demo
              </Button>
            </div>

            <p className="text-sm text-white/70">
              No credit card required • 14-day free trial • HIPAA compliant
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">VoiceCare</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="#" className="text-background/70 hover:text-background transition-colors">Privacy</a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">Terms</a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">Support</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-background/20 text-center">
            <p className="text-background/60">
              © 2024 VoiceCare. All rights reserved. Empowering healthcare through AI communication.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
