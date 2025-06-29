import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap, BarChart3, RefreshCw, CheckCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Returns Automation</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline">Admin Dashboard</Button>
            </Link>
            <Link href="/returns/demo-store">
              <Button>Try Demo Portal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-4 h-4 mr-1" />
          AI-Powered Returns Management
        </Badge>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Turn Returns Into
          <span className="text-blue-600"> Revenue</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Automate your returns process with AI-driven exchange suggestions. Reduce refunds, increase customer
          satisfaction, and boost your bottom line.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/returns/demo-store">
            <Button size="lg" className="text-lg px-8">
              Try Customer Portal
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              View Admin Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Optimize Returns</h2>
          <p className="text-lg text-gray-600">Comprehensive returns management with AI-powered insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>AI Exchange Suggestions</CardTitle>
              <CardDescription>
                Smart recommendations to convert refunds into exchanges using advanced AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  90%+ accuracy rate
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Confidence scoring
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Merchant override control
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Track your returns performance and revenue impact in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Revenue saved tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Exchange rate metrics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Trend analysis
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Branded Portal</CardTitle>
              <CardDescription>Seamless customer experience with your store's branding</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Custom branding
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Mobile optimized
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Multi-step flow
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Shopify Integration</CardTitle>
              <CardDescription>Native integration with your Shopify store and admin</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  OAuth security
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Real-time sync
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Webhook automation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Deep insights into return patterns and customer behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Return reason analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  AI performance metrics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Export capabilities
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Automated Workflows</CardTitle>
              <CardDescription>Streamline your returns process with intelligent automation</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Status notifications
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Email automation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Webhook processing
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600">Choose the plan that fits your business needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-center">Starter</CardTitle>
              <div className="text-center">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="text-center">Perfect for small businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Up to 100 returns/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  AI exchange suggestions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Basic analytics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Email support
                </li>
              </ul>
              <Button className="w-full bg-transparent" variant="outline">
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-600">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-center">Growth</CardTitle>
              <div className="text-center">
                <span className="text-4xl font-bold">$79</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="text-center">For growing businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Up to 500 returns/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Advanced AI suggestions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Full analytics suite
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Priority support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Custom branding
                </li>
              </ul>
              <Button className="w-full">Start Free Trial</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-center">Pro</CardTitle>
              <div className="text-center">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="text-center">For enterprise businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Unlimited returns
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  AI + ML insights
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Advanced reporting
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Dedicated support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  API access
                </li>
              </ul>
              <Button className="w-full bg-transparent" variant="outline">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Returns Process?</h2>
          <p className="text-xl mb-8 opacity-90">Join hundreds of merchants already using AI to boost their revenue</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/returns/demo-store">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Try Demo Portal
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Returns Automation</span>
              </div>
              <p className="text-gray-400">AI-powered returns management for modern e-commerce businesses.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Returns Automation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
