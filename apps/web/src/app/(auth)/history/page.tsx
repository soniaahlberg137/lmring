'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Card,
  CardContent,
  CardHeader,
  ConversationCardSkeleton,
} from '@lmring/ui';
import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon, MessageSquareIcon, Share2Icon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { toast } from 'sonner';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { type ConversationData, useConversation } from '@/hooks/use-conversation';

export default function HistoryPage() {
  const t = useTranslations('History');
  const { getConversationsWithModels, shareConversation, deleteConversation, isLoading } =
    useConversation();
  const [conversations, setConversations] = React.useState<ConversationData[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadConversations = async () => {
      const data = await getConversationsWithModels(50, 0);
      setConversations(data);
      setLoaded(true);
    };

    loadConversations();
  }, [getConversationsWithModels]);

  const handleShare = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await shareConversation(conversationId);
    if (result) {
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success(t('share_success'), {
        description: result.expiresAt
          ? t('share_expires', { date: new Date(result.expiresAt).toLocaleDateString() })
          : t('share_no_expire'),
      });
    } else {
      toast.error(t('share_failed'));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationToDelete(conversationId);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    const success = await deleteConversation(conversationToDelete);
    if (success) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete));
      toast.success(t('delete_success'));
    } else {
      toast.error(t('delete_failed'));
    }
    setConversationToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  if (!loaded) {
    return (
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <ClockIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">History</h1>
          </div>
          <div className="grid gap-4">
            <ConversationCardSkeleton count={5} />
          </div>
        </motion.div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <ClockIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">History</h1>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquareIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              No conversations yet
            </h2>
            <p className="text-muted-foreground/70 max-w-md">
              Start a new chat in the Arena to compare AI models. Your conversations will appear
              here.
            </p>
            <Link
              href="/arena"
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start New Chat
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <ClockIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">History</h1>
        </div>

        <div className="grid gap-4">
          {conversations.map((conversation, index) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={`/arena/${conversation.id}`}>
                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(conversation.updatedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, conversation.id)}
                          disabled={isLoading}
                          className="p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t('delete_aria_label')}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleShare(e, conversation.id)}
                          disabled={isLoading}
                          className="p-2 hover:bg-accent rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={t('share_aria_label')}
                        >
                          <Share2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MessageSquareIcon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-medium line-clamp-2">
                          {conversation.firstMessage
                            ? truncateText(conversation.firstMessage, 150)
                            : conversation.title}
                        </p>
                      </div>

                      {conversation.models && conversation.models.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {conversation.models.map((model, modelIndex) => (
                            <Badge
                              key={`${model.providerName}-${model.modelName}-${modelIndex}`}
                              variant="secondary"
                              className="flex items-center gap-1.5 text-xs py-1 px-2"
                            >
                              <ProviderIcon
                                providerId={model.providerName.toLowerCase()}
                                size={14}
                                type="avatar"
                              />
                              <span>{model.modelName}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AlertDialog
        open={!!conversationToDelete}
        onOpenChange={(open) => !open && setConversationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete_dialog_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConversationToDelete(null)}>
              {t('delete_dialog_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              {t('delete_dialog_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
