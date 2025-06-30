
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, ShoppingCart, Users, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Returns Automation System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your e-commerce returns process with AI-powered suggestions, 
            automated workflows, and comprehensive analytics.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <ShoppingCart className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Smart Returns Portal</CardTitle>
              <CardDescription>
                Customer-friendly return process with AI-powered exchange suggestions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Multi-Tenant Dashboard</CardTitle>
              <CardDescription>
                Manage multiple merchants with role-based access and permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Real-time insights on return patterns, costs, and customer behavior
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription>
                Access the admin dashboard or try the demo returns portal
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/admin">
                  Admin Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/returns/demo-store">
                  Try Demo Portal
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
