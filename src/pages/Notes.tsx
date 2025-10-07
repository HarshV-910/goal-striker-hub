import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Edit, Trash2, Download, Plus, Save, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Note {
  id: string;
  title: string;
  content: string;
  note_date: string;
  created_at: string;
}

const Notes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  // Get notes for selected date
  const selectedNotes = notes.filter(note => 
    format(new Date(note.note_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('note_date', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          user_id: user?.id,
          title: newNote.title,
          content: newNote.content,
          note_date: format(selectedDate, 'yyyy-MM-dd')
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote({ title: '', content: '' });
      setIsCreating(false);
      
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const updateNote = async (id: string, title: string, content: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ title, content })
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.map(note => 
        note.id === id ? { ...note, title, content } : note
      ));
      setEditingNote(null);
      
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== id));
      
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const exportNote = (note: Note, fileFormat: 'txt' | 'md') => {
    const dateFormatted = format(new Date(note.note_date), 'PPP');
    const createdFormatted = format(new Date(note.created_at), 'PPp');
    const content = `${note.title}\n\nDate: ${dateFormatted}\nCreated: ${createdFormatted}\n\n${note.content}`;
    const mimeType = fileFormat === 'md' ? 'text/markdown' : 'text/plain';
    const extension = fileFormat === 'md' ? 'md' : 'txt';
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: `Note exported as ${extension.toUpperCase()}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Your Notes</h1>
        <div className="flex items-center space-x-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Create New Note */}
      {isCreating && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Create New Note for {format(selectedDate, 'PPP')}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: '', content: '' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <Textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={6}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createNote}>
                <Save className="mr-2 h-4 w-4" />
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Notes for {format(selectedDate, 'PPP')} ({selectedNotes.length})
        </h2>
        
        {selectedNotes.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notes for this date</p>
                <Button 
                  onClick={() => setIsCreating(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Create your first note
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          selectedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingNote === note.id}
              onEdit={() => setEditingNote(note.id)}
              onSave={(title, content) => updateNote(note.id, title, content)}
              onCancel={() => setEditingNote(null)}
              onDelete={() => deleteNote(note.id)}
              onExport={(fileFormat) => exportNote(note, fileFormat)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onExport: (format: 'txt' | 'md') => void;
}

const NoteCard = ({ note, isEditing, onEdit, onSave, onCancel, onDelete, onExport }: NoteCardProps) => {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    onSave(editTitle, editContent);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    onCancel();
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-semibold"
            />
          ) : (
            <CardTitle className="text-xl">{note.title}</CardTitle>
          )}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onExport('txt')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport('md')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as Markdown
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Created: {format(new Date(note.created_at), 'PPp')}
        </p>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
          />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-2">{children}</h3>,
                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 ml-6 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 ml-6 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-3">
                    {children}
                  </pre>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                th: ({ children }) => (
                  <th className="border border-border px-4 py-2 text-left font-bold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-4 py-2">{children}</td>
                ),
                hr: () => <hr className="my-4 border-border" />,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 my-3 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Notes;