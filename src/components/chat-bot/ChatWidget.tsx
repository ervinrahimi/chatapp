"use client" /* eslint-disable @typescript-eslint/no-explicit-any */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageCircle, X, Send, Users } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RecordId } from "surrealdb"
import { cn } from "@/lib/utils"
import sdb from "@/db/surrealdb"
import Cookies from "js-cookie"
import * as React from "react"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface AdminsList {
  adminsList: {
    id: string
    imageUrl: string
    firstName: string
    lastName: string
    emailAddresses: string[]
  }[]
}

export function ChatWidget({ adminsList }: AdminsList) {
  // Initial admin greeting message
  const initialAdminMessage: Message = {
    id: "admin-msg-1",
    content: "Hello! How can I assist you today?",
    sender_id: "admin",
    created_at: new Date().toISOString(),
  }

  // State declarations
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([initialAdminMessage])
  const [showMainAdmin, setShowMainAdmin] = React.useState(false)
  const [showUserInfoDialog, setShowUserInfoDialog] = React.useState(true)
  const [userName, setUserName] = React.useState("")
  const [userEmail, setUserEmail] = React.useState("")
  const [dbClient, setDbClient] = React.useState<any>(null)
  const [chatUserId, setChatUserId] = React.useState<any>(null)
  const [chatId, setChatId] = React.useState<any>(null)
  const [chatStatus, setChatStatus] = React.useState("viewed")
  const [chat, setChat] = React.useState<any>(null)
  const [message, setMessage] = React.useState("")

  // Ref to track end of messages for scrolling
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll to bottom helper function
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Scroll to bottom whenever chat is open and user info dialog is not displayed
  React.useEffect(() => {
    if (isOpen && !showUserInfoDialog) {
      scrollToBottom()
    }
  }, [isOpen, showUserInfoDialog, scrollToBottom])

  // Connect to the SurrealDB database
  React.useEffect(() => {
    console.log(adminsList)
    const connectToDB = async () => {
      try {
        const db = await sdb()
        setDbClient(db)
      } catch (err) {
        console.error("Error connecting to SurrealDB:", err)
      }
    }
    connectToDB()
  }, [adminsList])

  // Read user info from cookies (if exists)
  React.useEffect(() => {
    const chatUserCookie = Cookies.get("chatUser")
    if (chatUserCookie) {
      try {
        const { chatUserId, chatId, userEmail, userName } = JSON.parse(chatUserCookie)
        const convertedChatUserId = new RecordId("ChatUser", chatUserId)
        const convertedChatId = new RecordId("Chat", chatId)
        setChatUserId(convertedChatUserId)
        setChatId(convertedChatId)
        setUserEmail(userEmail)
        setUserName(userName)
        setShowUserInfoDialog(false)
      } catch (error) {
        console.error("Error parsing chatUser cookie:", error)
      }
    }
  }, [])

  // Live subscription for messages
  React.useEffect(() => {
    if (!dbClient || !chatId) return

    const setupMessages = async () => {
      try {
        // Fetch all messages for the current chat
        const res = await dbClient.query(
          `SELECT * FROM Message WHERE chat_id = ${chatId} ORDER BY created_at ASC`
        )
        const initialMessages = res?.[0] || []
        setMessages([initialAdminMessage, ...initialMessages])

        // Set up live subscription for message events
        const queryId = await dbClient.live("Message")
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
        console.error("Error setting up live messages:", err)
      }
    }

    setupMessages()
  }, [dbClient, chatId])

  // Live subscription for chat status updates (to receive changes in status and admin_id)
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

  // Determine the active admin based on the chat record's admin_id field
  const activeAdmin = chat?.admin_id ? adminsList.find((admin) => String(admin.id) === String(chat.admin_id)) : null

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !chatUserId || !chatId) return

    try {
      await dbClient.create("Message", {
        chat_id: chatId,
        sender_id: chatUserId,
        content: message,
        sent_at: new Date(),
      })
      setMessage("")
      setTimeout(scrollToBottom, 0)
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  // Handle submission of user information and chat creation
  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userEmail && dbClient) {
      try {
        // Check if a user with the provided email already exists
        const res = await dbClient.query(
          `SELECT * FROM ChatUser WHERE email = '${userEmail}'`
        )
        let user
        if (res?.[0] && res[0].length > 0) {
          // Existing user: use the existing record
          user = res[0][0]
        } else {
          // Create a new user record in ChatUser table
          user = await dbClient.create("ChatUser", {
            clerk_id: "mxetjcvk4yfeygzxq0y1",
            name: userName,
            email: userEmail,
            created_at: new Date(),
          })
        }

        const userId = user.id || user[0]?.id

        // Create a new chat record with the user_id field
        const chat = await dbClient.create("Chat", {
          user_id: userId,
          status: "viewed",
          started_at: new Date(),
          ended_at: new Date(),
          created_at: new Date(),
        })

        const chatID = chat.id || chat[0]?.id

        setChatUserId(userId)
        setChatId(chatID)
        setShowUserInfoDialog(false)

        // Save user info in a cookie for 3 days
        Cookies.set(
          "chatUser",
          JSON.stringify({
            chatUserId: userId.id,
            chatId: chatID.id,
            userEmail,
            userName,
          }),
          { expires: 3 }
        )
      } catch (err) {
        console.error("Error saving user info or creating chat:", err)
      }
    }
  }

  // Fetch the chat record on page load
  React.useEffect(() => {
    if (!dbClient || !chatId) return

    const fetchChatRecord = async () => {
      try {
        const res = await dbClient.query(`SELECT * FROM Chat WHERE id = ${chatId}`)
        const chatRecord = res?.[0]?.[0]
        if (chatRecord) {
          setChat(chatRecord)
          setChatStatus(chatRecord.status)
          setShowMainAdmin(chatRecord.status === "active")
        }
      } catch (error) {
        console.error("Error fetching chat record:", error)
      }
    }

    fetchChatRecord()
  }, [dbClient, chatId])

  // Render the chat interface with messages and header
  const renderChatInterface = () => {
    // Separate the initial admin greeting message from the rest of the messages
    const adminMessage = messages.find((msg) => msg.id === "admin-msg-1")
    const otherMessages = messages
      .filter((msg) => msg.id !== "admin-msg-1")
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    const sortedMessages = adminMessage ? [adminMessage, ...otherMessages] : otherMessages

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
                        src={activeAdmin.imageUrl || ""}
                        alt={`${activeAdmin.firstName} ${activeAdmin.lastName}`}
                      />
                      <AvatarFallback>
                        {activeAdmin.firstName[0]}
                        {activeAdmin.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {activeAdmin.firstName} {activeAdmin.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {activeAdmin.emailAddresses[0]}
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
                  {adminsList.slice(0, 3).map((admin) => (
                    <Avatar key={admin.id} className="border-2 border-background">
                      <AvatarImage
                        src={admin.imageUrl || ""}
                        alt={`${admin.firstName} ${admin.lastName}`}
                      />
                      <AvatarFallback>
                        {admin.firstName[0]}
                        {admin.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {adminsList.length > 3 && (
                  <span className="text-sm">+{adminsList.length - 3}</span>
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
                const isUserMessage = String(msg.sender_id) === String(chatUserId)
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

  // Render the user information form for starting a chat
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
