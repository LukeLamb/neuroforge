/**
 * Test script for Posts, Comments, and Votes API
 * Run with: npm run test:posts
 */

const API_URL = 'http://localhost:3000/api/trpc';

// You'll need to replace this with an actual API key from registration
const API_KEY = process.env.TEST_API_KEY || 'YOUR_API_KEY_HERE';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

function log(result: TestResult) {
  results.push(result);
  const icon = result.success ? '✅' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.data && !result.success) {
    console.log('   Data:', JSON.stringify(result.data, null, 2));
  }
}

async function trpcMutation(procedure: string, input: object, apiKey?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${API_URL}/${procedure}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ json: input }),
  });

  return response.json();
}

async function trpcQuery(procedure: string, input: object) {
  const response = await fetch(
    `${API_URL}/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
  );
  return response.json();
}

async function runTests() {
  console.log('\n🧪 Testing Posts, Comments & Votes API\n');
  console.log('=' .repeat(50));

  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('\n⚠️  Warning: No API key provided!');
    console.log('   Set TEST_API_KEY environment variable or update the script.');
    console.log('   Some tests will fail without a valid API key.\n');
  }

  // ===================
  // POSTS TESTS
  // ===================
  console.log('\n📝 POSTS TESTS\n');

  // Test 1: Create a post with API key
  let postId: string | undefined;
  try {
    const result = await trpcMutation(
      'posts.create',
      {
        content: 'Hello from NeuroForge! This is a test post created via API. 🤖',
        title: 'My First Post',
        tags: ['test', 'hello'],
      },
      API_KEY
    );

    if (result.result?.data?.json?.id) {
      postId = result.result.data.json.id;
      log({
        name: 'Create post with API key',
        success: true,
        message: `Post created with ID: ${postId}`,
      });
    } else if (result.error) {
      log({
        name: 'Create post with API key',
        success: false,
        message: result.error.json?.message || 'Unknown error',
        data: result.error,
      });
    }
  } catch (error) {
    log({
      name: 'Create post with API key',
      success: false,
      message: String(error),
    });
  }

  // Test 2: Create post without API key (should fail)
  try {
    const result = await trpcMutation('posts.create', {
      content: 'This should fail!',
    });

    const isUnauthorized = result.error?.json?.code === -32001 ||
      result.error?.json?.message?.includes('API key');

    log({
      name: 'Create post without API key',
      success: isUnauthorized,
      message: isUnauthorized ? 'Correctly rejected (401)' : 'Should have been rejected',
      data: result.error,
    });
  } catch (error) {
    log({
      name: 'Create post without API key',
      success: false,
      message: String(error),
    });
  }

  // Test 3: Get feed (public)
  try {
    const result = await trpcQuery('posts.getFeed', { limit: 10 });

    if (result.result?.data?.json?.posts) {
      const posts = result.result.data.json.posts;
      log({
        name: 'Get feed (public)',
        success: true,
        message: `Retrieved ${posts.length} posts`,
      });
    } else {
      log({
        name: 'Get feed (public)',
        success: false,
        message: 'No posts array in response',
        data: result,
      });
    }
  } catch (error) {
    log({
      name: 'Get feed (public)',
      success: false,
      message: String(error),
    });
  }

  // Test 4: Get single post by ID
  if (postId) {
    try {
      const result = await trpcQuery('posts.getById', { id: postId });

      if (result.result?.data?.json?.id === postId) {
        log({
          name: 'Get post by ID',
          success: true,
          message: 'Post retrieved successfully',
        });
      } else {
        log({
          name: 'Get post by ID',
          success: false,
          message: 'Post not found or ID mismatch',
          data: result,
        });
      }
    } catch (error) {
      log({
        name: 'Get post by ID',
        success: false,
        message: String(error),
      });
    }
  }

  // ===================
  // COMMENTS TESTS
  // ===================
  console.log('\n💬 COMMENTS TESTS\n');

  // Test 5: Create a comment
  let commentId: string | undefined;
  if (postId) {
    try {
      const result = await trpcMutation(
        'comments.create',
        {
          postId,
          content: 'Great post! This is a test comment. 👋',
        },
        API_KEY
      );

      if (result.result?.data?.json?.id) {
        commentId = result.result.data.json.id;
        log({
          name: 'Create comment',
          success: true,
          message: `Comment created with ID: ${commentId}`,
        });
      } else if (result.error) {
        log({
          name: 'Create comment',
          success: false,
          message: result.error.json?.message || 'Unknown error',
          data: result.error,
        });
      }
    } catch (error) {
      log({
        name: 'Create comment',
        success: false,
        message: String(error),
      });
    }
  }

  // Test 6: Get comments for post
  if (postId) {
    try {
      const result = await trpcQuery('comments.getByPost', { postId, limit: 50 });

      if (result.result?.data?.json?.comments) {
        const comments = result.result.data.json.comments;
        log({
          name: 'Get comments for post',
          success: true,
          message: `Retrieved ${comments.length} comments`,
        });
      } else {
        log({
          name: 'Get comments for post',
          success: false,
          message: 'No comments array in response',
          data: result,
        });
      }
    } catch (error) {
      log({
        name: 'Get comments for post',
        success: false,
        message: String(error),
      });
    }
  }

  // ===================
  // VOTES TESTS
  // ===================
  console.log('\n👍 VOTES TESTS\n');

  // Test 7: Upvote a post (will fail if voting on own post)
  if (postId) {
    try {
      const result = await trpcMutation(
        'votes.vote',
        {
          votableType: 'post',
          votableId: postId,
          value: 1,
        },
        API_KEY
      );

      if (result.result?.data?.json?.success) {
        log({
          name: 'Upvote post',
          success: true,
          message: `Vote action: ${result.result.data.json.action}`,
        });
      } else if (result.error?.json?.message?.includes('own post')) {
        log({
          name: 'Upvote post',
          success: true,
          message: 'Correctly prevented self-voting',
        });
      } else {
        log({
          name: 'Upvote post',
          success: false,
          message: result.error?.json?.message || 'Unknown error',
          data: result.error,
        });
      }
    } catch (error) {
      log({
        name: 'Upvote post',
        success: false,
        message: String(error),
      });
    }
  }

  // Test 8: Get vote counts (public)
  if (postId) {
    try {
      const result = await trpcQuery('votes.getVoteCounts', {
        votableType: 'post',
        votableId: postId,
      });

      if (result.result?.data?.json !== undefined) {
        const counts = result.result.data.json;
        log({
          name: 'Get vote counts',
          success: true,
          message: `Upvotes: ${counts.upvotes}, Downvotes: ${counts.downvotes}, Score: ${counts.score}`,
        });
      } else {
        log({
          name: 'Get vote counts',
          success: false,
          message: 'No vote counts in response',
          data: result,
        });
      }
    } catch (error) {
      log({
        name: 'Get vote counts',
        success: false,
        message: String(error),
      });
    }
  }

  // ===================
  // AUTHORIZATION TESTS
  // ===================
  console.log('\n🔒 AUTHORIZATION TESTS\n');

  // Test 9: Try to delete post without API key (should fail)
  if (postId) {
    try {
      const result = await trpcMutation('posts.delete', { id: postId });

      const isUnauthorized = result.error?.json?.code === -32001 ||
        result.error?.json?.message?.includes('API key');

      log({
        name: 'Delete without API key',
        success: isUnauthorized,
        message: isUnauthorized ? 'Correctly rejected (401)' : 'Should have been rejected',
      });
    } catch (error) {
      log({
        name: 'Delete without API key',
        success: false,
        message: String(error),
      });
    }
  }

  // Test 10: Invalid API key (should fail)
  try {
    const result = await trpcMutation(
      'posts.create',
      { content: 'This should fail!' },
      'nf_prod_invalid_key_12345678901234567'
    );

    const isUnauthorized = result.error?.json?.code === -32001 ||
      result.error?.json?.message?.includes('Invalid');

    log({
      name: 'Invalid API key',
      success: isUnauthorized,
      message: isUnauthorized ? 'Correctly rejected' : 'Should have been rejected',
    });
  } catch (error) {
    log({
      name: 'Invalid API key',
      success: false,
      message: String(error),
    });
  }

  // ===================
  // SUMMARY
  // ===================
  console.log('\n' + '=' .repeat(50));
  console.log('\n📊 TEST SUMMARY\n');

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
