import './createPost.js';

import { Devvit, useState, useWebView } from '@devvit/public-api';
import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'Earworm',
  height: 'tall',
  render: (context) => {
    // Load username with `useAsync` hook
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? 'anon';
    });
    // Load latest score from redis with `useAsync` hook
    const [score, setScore] = useState(async () => {
      const redisScore = await context.redis.get(`score_${context.postId}`);
      return Number(redisScore ?? '');
    });

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      // URL of your web view content
      url: 'page.html',

      // Handle messages sent from the web view
      async onMessage(message, webView) {
        switch (message.type) {
          case 'webViewReady':
            webView.postMessage({
              type: 'initialData',
              data: {
                username: username,
                currentScore: score,
              },
            });
            break;
          case 'setScore':
            await context.redis.set(
              `score_${context.postId}`,
              message.data.setScore.toString()
            );
            setScore(message.data.setScore);

            webView.postMessage({
              type: 'updateScore',
              data: {
                newScore: message.data.setScore,
              },
            });
            break;
            default:
            throw new Error(`Unknown message type: ${message satisfies never}`);
        }
      },
      // Show a toast message when the web view is unmounted
      onUnmount() {
        context.ui.showToast('Great job! Share your score in the comments section');  
      },// Show a toast message when the web view is mounted
    });

    // Render the custom post type
    return (
      <vstack grow padding="small">
        <vstack grow alignment="middle center">
          <text size="xlarge" weight="bold">
         SnooScapes
          </text>
          <spacer />
          <vstack alignment="center">
            <hstack>
              <text size="medium">Hi, </text>
              <text size="medium" weight="bold">
                {' '}
                {username ?? ''}
              </text>
              <spacer />
              </hstack>
              </vstack>
              <spacer />
              <spacer />
              <vstack alignment='center'>
              <hstack  alignment='center'>
                <text size="small" alignment='center'>Use your mouse or arrow up/down keys to </text>
              </hstack>
              <hstack  alignment='center'>
                <text size="small" alignment='center'> create sticks that help Snoo get to the next platform </text>  
              </hstack>
              <hstack  alignment='center'>
                <text size="small" alignment='center'>Release the mouse or press arrow down when you're ready to drop the stick </text>  
              </hstack>
          </vstack>
          <spacer />
          <spacer />
          <spacer />

          <button onPress={() => webView.mount()}>Launch App</button>
        </vstack>
      </vstack>
    );
  },
});

export default Devvit;
