import React from 'react';
import { Question } from '../types';
import { CheckIcon, XIcon } from './icons/FeedbackIcons';

interface QuestionCardProps {
  question: Question;
  onAnswerSelect: (questionId: string, selectedOptionIndex: number) => void;
  userAnswer: number | null;
  showFeedback: boolean;
}

// Helper to process newlines within a plain text segment into React nodes
const processNewlinesForSegment = (textSegment: string): React.ReactNode[] => {
  if (!textSegment) return [];
  return textSegment.split('\n').map((line, index, array) => (
    <React.Fragment key={`line-${index}`}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
};

const highlightJsonSyntax = (jsonString: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  const tokenRegex = /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)|(\b(true|false|null)\b)|([-+]?\d*\.?\d+([eE][-+]?\d+)?)|([\{\}\[\]:,])/g;
  
  let prettyJsonString = jsonString;
  try {
    prettyJsonString = JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch (e) {
    // If it's not valid JSON, or already pretty-printed and parse fails, use as is.
    // This could happen if the input is not perfectly valid but still needs basic highlighting.
  }


  let match;
  while ((match = tokenRegex.exec(prettyJsonString)) !== null) {
    if (match.index > lastIndex) {
      elements.push(...processNewlinesForSegment(prettyJsonString.substring(lastIndex, match.index)));
    }

    const token = match[0];
    if (match[1]) { 
      if (token.endsWith(':')) {
        elements.push(<span key={lastIndex} className="token-key">{token.slice(0, -1)}</span>);
        elements.push(<span key={`${lastIndex}-colon`} className="token-punctuation">:</span>);
      } else {
        elements.push(<span key={lastIndex} className="token-string">{token}</span>);
      }
    } else if (match[5]) { 
      elements.push(<span key={lastIndex} className={`token-${token.toLowerCase() === 'null' ? 'null' : 'boolean'}`}>{token}</span>);
    } else if (match[6]) { 
      elements.push(<span key={lastIndex} className="token-number">{token}</span>);
    } else if (match[8]) { 
      elements.push(<span key={lastIndex} className="token-punctuation">{token}</span>);
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < prettyJsonString.length) {
    elements.push(...processNewlinesForSegment(prettyJsonString.substring(lastIndex)));
  }
  return elements;
};

const highlightYamlSyntax = (yamlString: string): React.ReactNode[] => {
  const lines = yamlString.split('\n');
  const highlightedNodes: React.ReactNode[] = [];

  const keyRegex = /^(\s*)(-?\s*)([\w.-]+)(:\s*)/; // Captures indent, list indicator (optional), key, and colon
  const commentRegex = /^(.*?)(\s*#.*)$/; // Captures content before comment and comment itself
  const listIndicatorRegex = /^(\s*-\s+)/;
  const tagRegex = /(\s*)(![\w\/:-]+)/;

  lines.forEach((line, lineIndex) => {
    const lineElements: React.ReactNode[] = [];
    let processedLine = line;

    // Handle comments first
    const commentMatch = processedLine.match(commentRegex);
    let commentText = '';
    if (commentMatch) {
      processedLine = commentMatch[1]; // Text before comment
      commentText = commentMatch[2];   // Comment text
    }

    // Handle indentation and list items
    const indentMatch = processedLine.match(/^(\s*)/);
    if (indentMatch) {
      lineElements.push(indentMatch[0].replace(/ /g, '\u00A0')); // Preserve spaces
      processedLine = processedLine.substring(indentMatch[0].length);
    }
    
    const keyMatch = processedLine.match(keyRegex);
    if (keyMatch && !processedLine.trim().startsWith('-')) { // Avoid matching keys inside simple list items incorrectly
      // keyMatch[1] is already handled by indentMatch or is empty
      if (keyMatch[2] && keyMatch[2].trim() === '-') { // List item with a key
         lineElements.push(<span key={`li-${lineIndex}`} className="token-yaml-indicator">{keyMatch[2].trimLeft()}</span>);
      }
      lineElements.push(<span key={`k-${lineIndex}`} className="token-key">{keyMatch[3]}</span>);
      lineElements.push(<span key={`p-${lineIndex}`} className="token-punctuation">{keyMatch[4].trimRight()}</span>);
      processedLine = processedLine.substring(keyMatch[0].length - indentMatch[0].length); // Subtract original indent length
    } else {
      const listMatch = processedLine.match(listIndicatorRegex);
      if (listMatch) {
        lineElements.push(<span key={`li-${lineIndex}`} className="token-yaml-indicator">{listMatch[1]}</span>);
        processedLine = processedLine.substring(listMatch[1].length);
      }
    }
    
    // Process remaining part of the line (value)
    if (processedLine.trim().length > 0) {
      let valueSegment = processedLine;
      const parts: React.ReactNode[] = [];
      let lastValueIndex = 0;
      
      // Regex for values: quoted strings, booleans, nulls, numbers, tags
      const valueRegex = /("[^"]*"|'[^']*')|(\b(true|false|yes|no|on|off|null|True|False|Yes|No|On|Off|Null|TRUE|FALSE|YES|NO|ON|OFF|NULL)\b)|([-+]?\d*\.?\d+([eE][-+]?\d+)?)|(![\w\/:-]+)/gi;
      let valueMatch;
      while((valueMatch = valueRegex.exec(valueSegment)) !== null) {
        if (valueMatch.index > lastValueIndex) {
          parts.push(valueSegment.substring(lastValueIndex, valueMatch.index));
        }
        if (valueMatch[1]) { // Quoted string
          parts.push(<span key={`val-str-${lineIndex}-${lastValueIndex}`} className="token-string">{valueMatch[1]}</span>);
        } else if (valueMatch[2]) { // Boolean or Null
          parts.push(<span key={`val-bool-${lineIndex}-${lastValueIndex}`} className={`token-${valueMatch[2].toLowerCase() === 'null' ? 'null' : 'boolean'}`}>{valueMatch[2]}</span>);
        } else if (valueMatch[4]) { // Number
          parts.push(<span key={`val-num-${lineIndex}-${lastValueIndex}`} className="token-number">{valueMatch[4]}</span>);
        } else if (valueMatch[6]) { // Tag
          parts.push(<span key={`val-tag-${lineIndex}-${lastValueIndex}`} className="token-yaml-tag">{valueMatch[6]}</span>);
        }
        lastValueIndex = valueRegex.lastIndex;
      }
      if (lastValueIndex < valueSegment.length) {
        parts.push(valueSegment.substring(lastValueIndex));
      }
      if (parts.length > 0) {
        lineElements.push(<span className="token-yaml-value">{parts}</span>);
      } else {
         lineElements.push(<span className="token-yaml-value">{processedLine}</span>); // Fallback for unstyled value
      }
    }

    if (commentText) {
      lineElements.push(<span key={`cmt-${lineIndex}`} className="token-yaml-comment">{commentText}</span>);
    }

    highlightedNodes.push(<div key={`yaml-line-${lineIndex}`}>{lineElements}</div>);
  });

  return highlightedNodes;
};


const renderFormattedText = (text: string): React.ReactNode[] => {
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  // Regex for ```block``` and `inline` code
  const regex = /(```(\w*)\n?([\s\S]*?)\n?```)|(`([^`]+?)`)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the current match
    if (match.index > lastIndex) {
      segments.push(...processNewlinesForSegment(text.substring(lastIndex, match.index)));
    }

    if (match[1]) { // ```block``` (match[1] is the whole block, match[2] is lang, match[3] is content)
      const lang = match[2]?.toLowerCase() || '';
      const content = match[3].trim(); // Trim content to remove extraneous newlines from block definition
      let highlightedContent: React.ReactNode[];

      if (lang === 'json') {
        try {
          highlightedContent = highlightJsonSyntax(content);
        } catch (e) {
          console.warn("Failed to parse JSON for highlighting, rendering as plain text:", content, e);
          highlightedContent = processNewlinesForSegment(content); // Fallback
        }
      } else if (lang === 'yaml' || lang === 'yml') {
         try {
          highlightedContent = highlightYamlSyntax(content);
        } catch (e) {
          console.warn("Failed to parse YAML for highlighting, rendering as plain text:", content, e);
          highlightedContent = processNewlinesForSegment(content); // Fallback
        }
      } else {
        // Basic highlighting for generic code blocks (strings and numbers)
        const genericElements: React.ReactNode[] = [];
        let genericLastIndex = 0;
        const genericRegex = /("[^"]*"|'[^']*')|([-+]?\d*\.?\d+([eE][-+]?\d+)?)/g;
        let genericMatch;
        const lines = content.split('\n');
        lines.forEach((line, lineIdx) => {
          let currentLinePos = 0;
          const lineNodes: React.ReactNode[] = [];
          while((genericMatch = genericRegex.exec(line)) !== null) {
            if(genericMatch.index > currentLinePos) {
              lineNodes.push(line.substring(currentLinePos, genericMatch.index));
            }
            if(genericMatch[1]) lineNodes.push(<span className="token-string">{genericMatch[1]}</span>);
            else if(genericMatch[2]) lineNodes.push(<span className="token-number">{genericMatch[2]}</span>);
            currentLinePos = genericRegex.lastIndex;
          }
          if(currentLinePos < line.length) {
            lineNodes.push(line.substring(currentLinePos));
          }
          genericElements.push(<div key={`gen-line-${lineIdx}`}>{lineNodes}</div>);
          genericRegex.lastIndex = 0; // Reset for next line
        });
        highlightedContent = genericElements.length > 0 ? genericElements : processNewlinesForSegment(content);
      }
      segments.push(
        <pre key={`block-${lastIndex}`} className="question-code-block">
          {highlightedContent}
        </pre>
      );
    } else if (match[4]) { // `inline` (match[4] is the whole inline block, match[5] is content)
      const content = match[5];
      segments.push(<code key={`inline-${lastIndex}`} className="question-inline-code">{content}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    segments.push(...processNewlinesForSegment(text.substring(lastIndex)));
  }
  
  // If no matches were found at all, but there's text, process it directly.
  // This handles cases where the entire text is plain without any code blocks or inline code.
  if (segments.length === 0 && text.length > 0) {
    return processNewlinesForSegment(text);
  }
  if (segments.length === 0 && text.trim().length === 0) return []; // Handle empty or whitespace-only string

  return segments;
};

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswerSelect, userAnswer, showFeedback }) => {
  const handleOptionClick = (index: number) => {
    onAnswerSelect(question.id, index);
  };

  const questionTextElements = renderFormattedText(question.text);

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md">
      <div className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
        {questionTextElements.length > 0 ? questionTextElements : processNewlinesForSegment(question.text)}
      </div>
      <div className="space-y-3">
        {question.options.map((optionText, index) => {
          const isSelected = userAnswer === index;
          const isCorrect = question.correctAnswerIndex === index;
          
          let optionClass = "quiz-option block w-full text-left p-4 rounded-md border-2 border-gray-300 hover:border-blue-500 transition-colors duration-150 cursor-pointer text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";

          if (showFeedback) {
            optionClass += " cursor-default"; 
            if (isSelected) {
              optionClass += isCorrect ? ' selected correct' : ' selected incorrect';
            } else if (isCorrect) {
              optionClass += ' correct-reveal'; 
            }
          }
          
          let content: React.ReactNode;
          const trimmedOptionText = optionText.trim();
          
          if (
            (trimmedOptionText.startsWith('{') && trimmedOptionText.endsWith('}')) ||
            (trimmedOptionText.startsWith('[') && trimmedOptionText.endsWith(']'))
          ) {
            try {
              JSON.parse(trimmedOptionText); 
              content = (
                <pre className="question-code-block language-json text-left text-xs my-0 !p-2"> {/* Reduced padding for options */}
                  {highlightJsonSyntax(trimmedOptionText)}
                </pre>
              );
            } catch (e) {
              content = renderFormattedText(optionText);
            }
          } else {
            content = renderFormattedText(optionText);
          }

          return (
            <button
              key={index}
              onClick={() => handleOptionClick(index)}
              disabled={showFeedback && userAnswer !== null} 
              className={optionClass}
            >
              <div className="flex items-start">
                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                <div className="flex-1">{content}</div>
                {showFeedback && isSelected && isCorrect && <CheckIcon className="h-6 w-6 text-white ml-2 flex-shrink-0" />} 
                {showFeedback && isSelected && !isCorrect && <XIcon className="h-6 w-6 text-white ml-2 flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      {showFeedback && userAnswer !== null && ( 
        <div className="mt-6 p-4 bg-white rounded-md border border-blue-300 shadow-sm">
          <h4 className="text-md font-semibold mb-2 text-blue-600">Explicação:</h4>
          <div className="text-gray-700 text-sm leading-relaxed">{renderFormattedText(question.explanation)}</div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
