# Review of Meme Feed Code

_by Nicolas Aubin - 26/10/2024_

## Code Comprehension

Most of the code relies on multiple nested `for` loops inside the `queryFn`. Using `for` loops can lead to readability issues and potential errors. On the other hand, `map` is clearer, requires no index management, and helps prevent side effects.

The comments section is currently integrated within the main component, but it would be beneficial to separate it into its own component for clarity.

## Code Performance

In the initial version, every meme is fetched, then for each meme, every author and comment is fetched, and for every author, their own details are fetched. This results in a significant performance bottleneck.

To improve this, consider adjusting the UX slightly and implementing **pagination**. Additionally, use `Promise.all` to fetch independent requests simultaneously, improving efficiency.

With `@tanstack/react-query`, you can use `useInfiniteQuery` to implement an infinite scroll easily. [See documentation here](https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery).

Since comments aren’t displayed immediately but are only shown when a button is clicked, they can be fetched upon interaction.

## Solution

1. Remove comments from the initial fetch.
2. Replace `for` loops with `map` and leverage `Promise.all` for parallel requests.
3. Switch from `useQuery` to `useInfiniteQuery` for both memes and comments, using pagination.
4. Add a `handleScroll` function to automatically fetch new memes when the user reaches the end of the page.
5. Fetch comments when the `Collapse` component is triggered.

### Good luck!
