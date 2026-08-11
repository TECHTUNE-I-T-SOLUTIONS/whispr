'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TestResult {
  success: boolean
  messageId?: string
  error?: string
}

export default function EmailTestingPage() {
  const [emailType, setEmailType] = useState<string>('welcome')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [customData, setCustomData] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const { toast } = useToast()

  const handleSendTestEmail = async () => {
    if (!recipientEmail) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Recipient email is required'
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a valid email address'
      })
      return
    }

    setIsSending(true)
    setResult(null)

    try {
      let data: any = {
        recipientName: recipientEmail.split('@')[0],
        recipientEmail,
      }

      // Add custom data if provided
      if (customData) {
        try {
          const parsedData = JSON.parse(customData)
          data = { ...data, ...parsedData }
        } catch (e) {
          toast({
            variant: 'destructive',
            title: 'Invalid JSON',
            description: 'Custom data must be valid JSON'
          })
          setIsSending(false)
          return
        }
      }

      // Add default test data based on email type
      switch (emailType) {
        case 'verification':
          data.verificationUrl = 'https://whisprwords.com/verify?token=test123'
          break
        case 'password_reset':
          data.resetUrl = 'https://whisprwords.com/auth/reset-password?token=test123'
          break
        case 'new_follower':
          data.followerName = 'Test User'
          data.followerProfileUrl = 'https://whisprwords.com/chronicles/profile/test'
          break
        case 'new_comment':
          data.commenterName = 'Test User'
          data.commentContent = 'This is a test comment on your post!'
          data.postTitle = 'Test Post Title'
          data.postUrl = 'https://whisprwords.com/chronicles/posts/test'
          break
        case 'new_like':
          data.likerName = 'Test User'
          data.likerProfileUrl = 'https://whisprwords.com/chronicles/profile/test'
          break
        case 'notification':
          data.notificationTitle = 'Test Notification'
          data.notificationMessage = 'This is a test notification message.'
          data.actionUrl = 'https://whisprwords.com'
          data.actionText = 'View Details'
          break
        case 'support':
          data.supportTicketId = 'TEST-001'
          data.supportMessage = 'This is a test support request.'
          break
      }

      const response = await fetch('/api/admin/email-testing/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: emailType,
          to: recipientEmail,
          data,
        }),
      })

      const testResult = await response.json()
      setResult(testResult)

      if (testResult.success) {
        toast({
          title: 'Email Sent Successfully',
          description: `Message ID: ${testResult.messageId || 'N/A'}`
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Email Failed',
          description: testResult.error || 'Unknown error'
        })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send test email'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCheckHealth = async () => {
    try {
      const response = await fetch('/api/admin/email-testing/health')
      const health = await response.json()

      if (health.smtp && health.config) {
        toast({
          title: 'Email Service Healthy',
          description: 'SMTP connection is working properly'
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Email Service Issues',
          description: `Config: ${health.config ? 'OK' : 'Missing'}, SMTP: ${health.smtp ? 'OK' : 'Failed'}`
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Health Check Failed',
        description: 'Could not check email service health'
      })
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-md sm:text-3xl font-serif font-bold flex items-center gap-2">
            <Mail className="h-4 w-4 sm:h-8 sm:w-8 text-primary" />
            <span className="truncate">Email Testing</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Test Whispr email delivery with Zoho Mail SMTP</p>
        </div>
        <Button variant="outline" onClick={handleCheckHealth}>
          Check SMTP Health
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-2">
        {/* Email Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Email Configuration</CardTitle>
              <CardDescription className="text-sm">
                Configure and send test emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailType">Email Type</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="verification">Email Verification</SelectItem>
                    <SelectItem value="password_reset">Password Reset</SelectItem>
                    <SelectItem value="new_follower">New Follower</SelectItem>
                    <SelectItem value="new_comment">New Comment</SelectItem>
                    <SelectItem value="new_like">New Like</SelectItem>
                    <SelectItem value="notification">General Notification</SelectItem>
                    <SelectItem value="support">Support Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your email to receive the test message
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customData">Custom Data (JSON, optional)</Label>
                <Textarea
                  id="customData"
                  placeholder='{"username": "testuser", "verificationUrl": "..."}'
                  value={customData}
                  onChange={(e) => setCustomData(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Override default test data with custom JSON
                </p>
              </div>

              <Button
                onClick={handleSendTestEmail}
                disabled={isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Email Type Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Email Type Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Welcome:</span>
                  <span>hello@whisprwords.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verification:</span>
                  <span>no-reply@whisprwords.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password Reset:</span>
                  <span>no-reply@whisprwords.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notifications:</span>
                  <span>notifications@whisprwords.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Support:</span>
                  <span>support@whisprwords.com</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Test Result</CardTitle>
              <CardDescription className="text-sm">
                View the result of your test email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {result.success ? 'Email Sent Successfully' : 'Email Failed'}
                      </p>
                      {result.messageId && (
                        <p className="text-sm text-muted-foreground">
                          Message ID: {result.messageId}
                        </p>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-500">
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test results yet</p>
                  <p className="text-sm">Send a test email to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Testing Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Testing Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">1. Test with real email providers</p>
                <p className="text-muted-foreground">Test with Gmail, Outlook, and other major providers to verify rendering.</p>
              </div>
              <div>
                <p className="font-medium mb-1">2. Check sender address</p>
                <p className="text-muted-foreground">Verify the correct sender alias is used for each email type.</p>
              </div>
              <div>
                <p className="font-medium mb-1">3. Verify links work</p>
                <p className="text-muted-foreground">Click all links in the email to ensure they redirect correctly.</p>
              </div>
              <div>
                <p className="font-medium mb-1">4. Check mobile rendering</p>
                <p className="text-muted-foreground">View emails on mobile devices to ensure responsive design works.</p>
              </div>
              <div>
                <p className="font-medium mb-1">5. Verify plain-text fallback</p>
                <p className="text-muted-foreground">Check that plain-text version is readable if HTML is disabled.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
