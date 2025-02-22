"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import sdb from "@/db/surrealdb"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "admin-msg-1",
      content: "Hello! How can I assist you today?",
      sender_id: "admin",
      created_at: new Date().toISOString(),
    },
  ])
  const [showMainAdmin, setShowMainAdmin] = React.useState(false)
  const [showUserInfoDialog, setShowUserInfoDialog] = React.useState(true)
  const [userName, setUserName] = React.useState("")
  const [userEmail, setUserEmail] = React.useState("")
  const [dbClient, setDbClient] = React.useState<any>(null)
  const [customerId, setCustomerId] = React.useState<string | null>(null)
  const [chatId, setChatId] = React.useState<string | null>(null)
  const [chatStatus, setChatStatus] = React.useState("viewed")
  // Save the complete chat record to get admin_id
  const [chat, setChat] = React.useState<any>(null)
  // New state to store real admins from the database
  const [admins, setAdmins] = React.useState<any[]>([])

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  React.useEffect(() => {
    if (isOpen && !showUserInfoDialog) {
      scrollToBottom()
    }
  }, [isOpen, showUserInfoDialog, scrollToBottom])

  React.useEffect(() => {
    const connectToDB = async () => {
      try {
        const db = await sdb()
        setDbClient(db)
      } catch (err) {
        console.error("Error connecting to SurrealDB:", err)
      }
    }
    connectToDB()
  }, [])

  // Live subscription for messages
  React.useEffect(() => {
    if (!dbClient || !chatId) return

    let queryId: string | null = null

    const setupLiveQuery = async () => {
      try {
        const res = await dbClient.query(
          `SELECT * FROM Message WHERE chat_id = '${chatId}' ORDER BY created_at ASC`
        )
        const initialMessages = res?.[0] || []
        setMessages((prev) => [...prev, ...initialMessages])

        queryId = await dbClient.live("Message")
        dbClient.subscribeLive(queryId, (action: string, result: any) => {
          if (action === "CLOSE") return
          if (action === "CREATE") {
            setMessages((prev) => [...prev, result])
          } else if (action === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === result.id ? result : msg))
            )
          } else if (action === "DELETE") {
            setMessages((prev) => prev.filter((msg) => msg.id !== result.id))
          }
        })
      } catch (err) {
        console.error("Error setting up live query:", err)
      }
    }

    setupLiveQuery()

    return () => {
      if (queryId) {
        dbClient
          .kill(queryId)
          .catch((err: unknown) =>
            console.error("Error killing live query:", err)
          )
      }
    }
  }, [dbClient, chatId])

  // Live subscription for chat to get updates (both status and admin_id)
  React.useEffect(() => {
    if (!dbClient || !chatId) return

    let chatQueryId: string | null = null

    const subscribeChatStatus = async () => {
      try {
        chatQueryId = await dbClient.live("Chat")
        dbClient.subscribeLive(chatQueryId, (action: string, result: any) => {
          if (action === "CLOSE") return
          if (String(result.id) === String(chatId)) {
            setChat(result)
            setChatStatus(result.status)
            setShowMainAdmin(result.status === "active")
          }
        })
      } catch (err) {
        console.error("Error subscribing to chat live updates:", err)
      }
    }

    subscribeChatStatus()

    return () => {
      if (chatQueryId) {
        dbClient
          .kill(chatQueryId)
          .catch((err: unknown) =>
            console.error("Error killing chat live query:", err)
          )
      }
    }
  }, [dbClient, chatId])

  // Live subscription for admins
  React.useEffect(() => {
    if (!dbClient) return

    let adminQueryId: string | null = null

    const setupLiveAdmins = async () => {
      try {
        // Initial fetch of admins list
        const res = await dbClient.query(`SELECT * FROM ChatAdmin`)
        const initialAdmins = res?.[0] || []
        setAdmins(initialAdmins)

        adminQueryId = await dbClient.live("ChatAdmin")
        dbClient.subscribeLive(adminQueryId, (action: string, result: any) => {
          if (action === "CLOSE") return
          if (action === "CREATE") {
            setAdmins((prev) => [...prev, result])
          } else if (action === "UPDATE") {
            setAdmins((prev) =>
              prev.map((admin) => (admin.id === result.id ? result : admin))
            )
          } else if (action === "DELETE") {
            setAdmins((prev) =>
              prev.filter((admin) => admin.id !== result.id)
            )
          }
        })
      } catch (err) {
        console.error("Error setting up live admins:", err)
      }
    }

    setupLiveAdmins()

    return () => {
      if (adminQueryId) {
        dbClient
          .kill(adminQueryId)
          .catch((err: unknown) =>
            console.error("Error killing live admins query:", err)
          )
      }
    }
  }, [dbClient])

  // Determine the active admin based on the admin_id field from the chat record
  const activeAdmin = chat?.admin_id
    ? admins.find(
        (admin) => String(admin.id) === String(chat.admin_id)
      )
    : null

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !customerId || !chatId) return

    try {
      await dbClient.create("Message", {
        chat_id: chatId,
        sender_id: customerId,
        content: message,
        sent_at: new Date(),
      })
      setMessage("")
      setTimeout(scrollToBottom, 0)
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userEmail && dbClient) {
      try {
        // Check for existing user by email
        const res = await dbClient.query(
          `SELECT * FROM ChatUser WHERE email = '${userEmail}'`
        )
        let user
        if (res?.[0] && res[0].length > 0) {
          // Existing user: use existing record info
          user = res[0][0]
        } else {
          // User does not exist; create a new user in ChatUser table
          user = await dbClient.create("ChatUser", {
            clerk_id: "mxetjcvk4yfeygzxq0y1",
            name: userName,
            email: userEmail,
            created_at: new Date(),
          })
        }

        const userId = user.id || user[0]?.id

        // Create a new chat using the user_id field according to the new model
        const chat = await dbClient.create("Chat", {
          user_id: userId,
          status: "viewed",
          started_at: new Date(),
          ended_at: new Date(),
          created_at: new Date(),
        })

        const chatID = chat.id || chat[0]?.id

        setCustomerId(userId)
        setChatId(chatID)
        setShowUserInfoDialog(false)
      } catch (err) {
        console.error("Error saving user info or creating chat:", err)
      }
    }
  }

  const renderChatInterface = () => {
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    return (
      <Card className="w-[320px] h-[480px] flex flex-col">
        <CardHeader className="space-y-1.5 p-4">
          <div className="flex justify-between items-center">
            {showMainAdmin ? (
              <div className="flex items-center gap-2">
                {activeAdmin ? (
                  <>
                    <Avatar>
                      <AvatarImage
                        src={activeAdmin.image || ""}
                        alt={`${activeAdmin.firstname} ${activeAdmin.lastname}`}
                      />
                      <AvatarFallback>
                        {activeAdmin.firstname[0]}
                        {activeAdmin.lastname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {activeAdmin.firstname} {activeAdmin.lastname}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {activeAdmin.email}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-sm">Active admin not found</div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {admins.slice(0, 3).map((admin) => (
                    <Avatar key={admin.id} className="border-2 border-background">
                      <AvatarImage
                        src={admin.image || ""}
                        alt={`${admin.firstname} ${admin.lastname}`}
                      />
                      <AvatarFallback>
                        {admin.firstname[0]}
                        {admin.lastname[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {admins.length > 3 && (
                  <span className="text-sm">+{admins.length - 3}</span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              {chatStatus === "active" && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMainAdmin(!showMainAdmin)}
                >
                  <Users className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[340px] p-4">
            <div className="space-y-4">
              {sortedMessages.map((msg) => {
                const isUserMessage =
                  String(msg.sender_id) === String(customerId)
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      isUserMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[80%]",
                        isUserMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-3">
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" variant="secondary">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    )
  }

  const renderUserInfoForm = () => (
    <Card className="w-[320px] h-[480px] flex flex-col">
      <CardHeader className="space-y-1.5 p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Welcome to Chat</h3>
          <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-center">
        <form onSubmit={handleUserInfoSubmit} className="space-y-4 w-full">
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Start Chatting
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  return (
    <div className="fixed bottom-4 right-4">
      {isOpen ? (
        showUserInfoDialog ? (
          renderUserInfoForm()
        ) : (
          renderChatInterface()
        )
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
