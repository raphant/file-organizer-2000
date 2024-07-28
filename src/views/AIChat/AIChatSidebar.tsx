import React, { useState, useEffect } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from 'react-markdown';
import FileOrganizer from "../..";
import { logMessage } from "../../../utils";
import { TFile, TFolder } from "obsidian";
import Fuse from "fuse.js";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => <input {...props} className={`input ${props.className || ""}`} />;

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, ...props }) => (
  <button {...props} className={`button ${props.className || ""}`}>
    {children}
  </button>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => (
  <div {...props} className={`card ${props.className || ""}`}>
    {children}
  </div>
);

export const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement> & { role: 'user' | 'assistant' }> = ({
  role,
  ...props
}) => (
  <div {...props} className={`avatar ${role} ${props.className || ""}`}>
    {role === 'user' ? '👤' : '🤖'}
  </div>
);

interface ChatComponentProps {
  plugin: FileOrganizer;
  fileContent: string;
  fileName: string | null;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ plugin, fileContent, fileName }) => {
  console.log(fileContent, 'debug');
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `${plugin.getServerUrl()}/api/chat`,
    body: { fileContent, fileName },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <>
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}-message`}>
            <Avatar role={message.role as 'user' | 'assistant'} />
            <div className="message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Send a message."
        />
        <Button type="submit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </Button>
      </form>
    </>
  );
};

interface AIChatSidebarProps {
  plugin: FileOrganizer;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ plugin }) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(""); // New state for input value
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState<string | null>(null);
  const [fuse, setFuse] = useState<Fuse<string> | null>(null);

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(prevValue => {
      const parts = prevValue.split('@');
      parts[parts.length - 1] = suggestion;
      return parts.join('@') + ' ';
    });
    setShowSuggestions(false);
  };

  const { messages, input, handleInputChange, handleSubmit, completion } = useChat({
    api: `${plugin.getServerUrl()}/api/chat`,
    body: { fileContent, fileName },
  });

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (autocompleteSuggestion) {
        setInputValue(prevValue => prevValue + autocompleteSuggestion);
        setAutocompleteSuggestion(null);
      } else {
        const suggestion = await completion(inputValue);
        setAutocompleteSuggestion(suggestion);
      }
    }
  };

  const handleInputChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    handleInputChange(e);
    setAutocompleteSuggestion(null);

    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowSuggestions(true);
      setSuggestions([]); // Clear suggestions when '@' is typed
    } else if (showSuggestions && lastAtIndex !== -1 && fuse) {
      const query = value.slice(lastAtIndex + 1);
      const results = fuse.search(query);
      setSuggestions(results.map(result => result.item).slice(0, 5));
    } else {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const loadFileContent = async () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        try {
          const content = await plugin.app.vault.read(activeFile);
          setFileContent(content);
          setFileName(activeFile.name);
        } catch (error) {
          logMessage(`Error reading file: ${error}`);
          setFileContent("");
          setFileName(null);
        }
      } else {
        setFileContent("");
        setFileName(null);
      }
      setKey(prevKey => prevKey + 1);
    };

    loadFileContent();

    // Set up event listener for file changes
    const onFileOpen = plugin.app.workspace.on('file-open', loadFileContent);

    // Set up fuzzy search
    const files = plugin.app.vault.getFiles();
    const folders = plugin.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder) as TFolder[];
    const allItems = [...files, ...folders].map(item => item.path);
    
    const newFuse = new Fuse(allItems, {
      threshold: 0.3,
      distance: 100,
    });
    setFuse(newFuse);

    return () => {
      plugin.app.workspace.offref(onFileOpen);
    };
  }, [plugin.app.workspace, plugin.app.vault]);

  return (
    <Card className="ai-chat-sidebar">
      <ChatComponent 
        key={key}
        plugin={plugin}
        fileContent={fileContent}
        fileName={fileName}
      />
      <div className="input-wrapper">
        <Input
          value={inputValue}
          onChange={handleInputChangeWrapper}
          placeholder="Send a message. Use @ to autocomplete file names."
        />
      </div>
      {showSuggestions && (
        <div className="suggestions">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AIChatSidebar;