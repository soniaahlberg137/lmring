'use client';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardHeader,
  cn,
  ResponseViewer,
  ScrollArea,
  Skeleton,
} from '@lmring/ui';
import { motion } from 'framer-motion';
import { AlertCircleIcon, CalendarIcon, ClockIcon, UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { AppConfig } from '@/utils/AppConfig';

interface VoteResult {
  modelName: string;
  providerName: string;
  outcome: 'winner' | 'loser' | 'tie' | 'all_bad';
}

interface VoteInfo {
  voteType?: 'winner' | 'tie' | 'all_bad';
  voteResults?: VoteResult[];
}

interface ModelResponse {
  id: string;
  modelName: string;
  providerName: string;
  responseContent: string;
  tokensUsed: number | null;
  responseTimeMs: number | null;
  displayPosition: number;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  responses?: ModelResponse[];
  voteInfo?: VoteInfo;
}

interface SharedUser {
  name: string | null;
  avatarUrl: string | null;
}

interface SharedConversation {
  conversation: {
    id: string;
    title: string;
    createdAt: string;
  };
  user: SharedUser;
  messages: Message[];
}

type PageStatus = 'loading' | 'success' | 'not_found' | 'expired' | 'error';

export default function SharedConversationPage() {
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = React.useState<PageStatus>('loading');
  const [data, setData] = React.useState<SharedConversation | null>(null);

  React.useEffect(() => {
    const fetchSharedConversation = async () => {
      try {
        const response = await fetch(`/api/shared/${token}`);

        if (response.status === 404) {
          setStatus('not_found');
          return;
        }

        if (response.status === 410) {
          setStatus('expired');
          return;
        }

        if (!response.ok) {
          setStatus('error');
          return;
        }

        const result = await response.json();
        setData(result);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };

    fetchSharedConversation();
  }, [token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="h-screen bg-background flex flex-col">
        <SharedHeader />
        <div className="flex-1 overflow-auto">
          <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
            {/* User message skeleton */}
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </div>

            {/* Model response cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <Card key={i} className="flex flex-col overflow-hidden">
                  <CardHeader className="pb-3 flex-shrink-0 space-y-0 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="h-screen bg-background flex flex-col">
        <SharedHeader />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <AlertCircleIcon className="h-16 w-16 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold">Conversation Not Found</h2>
            <p className="text-muted-foreground max-w-md">
              This shared conversation does not exist or has been deleted.
            </p>
            <Link
              href="/"
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="h-screen bg-background flex flex-col">
        <SharedHeader />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <ClockIcon className="h-16 w-16 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold">Link Expired</h2>
            <p className="text-muted-foreground max-w-md">
              This shared conversation link has expired and is no longer accessible.
            </p>
            <Link
              href="/"
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <SharedHeader />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <AlertCircleIcon className="h-16 w-16 text-destructive/50" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground max-w-md">
              Unable to load this conversation. Please try again later.
            </p>
            <Link
              href="/"
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const getUniqueModels = () => {
    const models: Array<{ providerName: string; modelName: string }> = [];
    const seen = new Set<string>();
    for (const message of data.messages) {
      if (message.responses) {
        for (const response of message.responses) {
          const key = `${response.providerName}:${response.modelName}`;
          if (!seen.has(key)) {
            seen.add(key);
            models.push({
              providerName: response.providerName,
              modelName: response.modelName,
            });
          }
        }
      }
    }
    return models;
  };

  const uniqueModels = getUniqueModels();

  // Organize messages as conversation turns
  const conversationTurns: Array<{
    userMessage: Message;
    modelResponses: ModelResponse[];
    voteInfo?: VoteInfo;
  }> = [];

  for (const message of data.messages) {
    if (message.role === 'user' && message.responses && message.responses.length > 0) {
      conversationTurns.push({
        userMessage: message,
        modelResponses: message.responses,
        voteInfo: message.voteInfo,
      });
    }
  }

  const latestVoteInfo = conversationTurns.find((turn) => turn.voteInfo)?.voteInfo;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <SharedHeader
        title={data.conversation.title}
        createdAt={formatDate(data.conversation.createdAt)}
        models={uniqueModels}
        voteInfo={latestVoteInfo}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            {conversationTurns.length > 0 ? (
              conversationTurns.map((turn, turnIndex) => (
                <motion.div
                  key={turn.userMessage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: turnIndex * 0.1 }}
                  className="space-y-4"
                >
                  <div className="bg-muted/30 rounded-lg p-4">
                    <UserPrompt content={turn.userMessage.content} user={data.user} />
                  </div>

                  <ArenaModelGrid responses={turn.modelResponses} voteInfo={turn.voteInfo} />

                  {turnIndex < conversationTurns.length - 1 && (
                    <div className="border-b border-dashed my-6" />
                  )}
                </motion.div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground py-20">
                No conversation content available
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-background/95 backdrop-blur-sm px-4 py-3 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            This is a read-only view of a shared conversation from{' '}
            <Link href="/" className="text-primary hover:underline">
              {AppConfig.name}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

interface SharedHeaderProps {
  title?: string;
  createdAt?: string;
  models?: Array<{ providerName: string; modelName: string }>;
  voteInfo?: VoteInfo;
}

function SharedHeader({ title, createdAt, models, voteInfo }: SharedHeaderProps) {
  const getVoteColorClass = (modelName: string, providerName: string) => {
    const voteResult = voteInfo?.voteResults?.find(
      (r) => r.modelName === modelName && r.providerName === providerName,
    );
    if (!voteResult) return '';
    switch (voteResult.outcome) {
      case 'winner':
        return 'border-amber-500/50 text-amber-600 bg-amber-500/10';
      case 'tie':
        return 'border-green-500/50 text-green-600 bg-green-500/10';
      case 'all_bad':
        return 'border-red-500/50 text-red-600 bg-red-500/10';
      default:
        return '';
    }
  };

  const hasVoteResult = (modelName: string, providerName: string) => {
    return voteInfo?.voteResults?.some(
      (r) => r.modelName === modelName && r.providerName === providerName,
    );
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50 flex-shrink-0">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <h1 className="text-xl font-bold">{AppConfig.name}</h1>
          </Link>

          {title && (
            <div className="flex-1 flex items-center justify-center gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium truncate max-w-[300px]">{title}</span>
                {createdAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                    <CalendarIcon className="h-3 w-3" />
                    {createdAt}
                  </span>
                )}
              </div>
              {models && models.length > 0 && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  {models.map((model) => (
                    <Badge
                      key={`${model.providerName}:${model.modelName}`}
                      variant={
                        hasVoteResult(model.modelName, model.providerName) ? 'outline' : 'secondary'
                      }
                      className={cn(
                        'flex items-center gap-1.5 text-xs py-1 px-2',
                        getVoteColorClass(model.modelName, model.providerName),
                      )}
                    >
                      <ProviderIcon providerId={model.providerName.toLowerCase()} size={12} />
                      <span className="truncate max-w-[120px]">{model.modelName}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link
            href="/sign-in"
            className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors flex-shrink-0"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}

interface UserPromptProps {
  content: string;
  user?: SharedUser;
}

function UserPrompt({ content, user }: UserPromptProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return null;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-start gap-3">
      <Avatar className="size-8 border shadow-sm flex-shrink-0">
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name || 'User'}
            width={32}
            height={32}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <AvatarFallback className="bg-primary/10">
            {getInitials(user?.name) || <UserIcon className="size-4 text-primary" />}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground mb-1">{user?.name || 'Prompt'}</p>
        <p className="whitespace-pre-wrap text-foreground">{content}</p>
      </div>
    </div>
  );
}

function ArenaModelGrid({
  responses,
  voteInfo,
}: {
  responses: ModelResponse[];
  voteInfo?: VoteInfo;
}) {
  const sortedResponses = [...responses].sort((a, b) => a.displayPosition - b.displayPosition);
  const columnCount = sortedResponses.length;

  const getVoteState = (response: ModelResponse) => {
    const voteResult = voteInfo?.voteResults?.find(
      (r) => r.modelName === response.modelName && r.providerName === response.providerName,
    );
    return voteResult?.outcome || 'none';
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        columnCount === 1 && 'grid-cols-1',
        columnCount === 2 && 'grid-cols-1 md:grid-cols-2',
        columnCount === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columnCount >= 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {sortedResponses.map((response, index) => (
        <motion.div
          key={response.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <ModelResponseCard response={response} voteState={getVoteState(response)} />
        </motion.div>
      ))}
    </div>
  );
}

type VoteState = 'none' | 'winner' | 'loser' | 'tie' | 'all_bad';

function ModelResponseCard({
  response,
  voteState = 'none',
}: {
  response: ModelResponse;
  voteState?: VoteState;
}) {
  const voteStateBorderStyles: Record<VoteState, string> = {
    winner: 'ring-1 ring-amber-500 border-amber-500 shadow-amber-500/20',
    loser: '',
    tie: 'ring-1 ring-green-500 border-green-500 shadow-green-500/20',
    all_bad: 'ring-1 ring-red-500 border-red-500 shadow-red-500/20',
    none: '',
  };

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-all duration-200',
        voteStateBorderStyles[voteState],
      )}
    >
      <CardHeader className="pb-3 flex-shrink-0 space-y-0 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <ProviderIcon providerId={response.providerName.toLowerCase()} size={20} />
            <span className="font-medium truncate">{response.modelName}</span>
          </div>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {response.providerName}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
          {response.responseTimeMs !== null && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {response.responseTimeMs}ms
            </span>
          )}
          {response.tokensUsed !== null && <span>{response.tokensUsed} tokens</span>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            <ResponseViewer
              content={response.responseContent}
              isStreaming={false}
              className="overflow-x-auto"
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
