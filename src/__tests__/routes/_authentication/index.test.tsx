import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChakraProvider } from "@chakra-ui/react"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { AuthenticationContext } from "../../../contexts/authentication"
import { MemeFeedPage } from "../../../routes/_authentication/index"
import { renderWithRouter } from "../../utils"
import { act } from "react"

describe("routes/_authentication/index", () => {
  describe("MemeFeedPage", () => {
    function renderMemeFeedPage() {
      return renderWithRouter({
        component: MemeFeedPage,
        Wrapper: ({ children }) => (
          <ChakraProvider>
            <QueryClientProvider client={new QueryClient()}>
              <AuthenticationContext.Provider
                value={{
                  state: {
                    isAuthenticated: true,
                    userId: "dummy_user_id",
                    token: "dummy_token",
                  },
                  authenticate: () => {},
                  signout: () => {},
                }}
              >
                {children}
              </AuthenticationContext.Provider>
            </QueryClientProvider>
          </ChakraProvider>
        ),
      })
    }

    it("should fetch the memes and display them with their comments", async () => {
      renderMemeFeedPage()

      await waitFor(() => {
        // We check that the right author's username is displayed
        expect(
          screen.getByTestId("meme-author-dummy_meme_id_1")
        ).toHaveTextContent("dummy_user_1")

        // We check that the right meme's picture is displayed
        expect(screen.getByTestId("meme-picture-dummy_meme_id_1")).toHaveStyle({
          "background-image": 'url("https://dummy.url/meme/1")',
        })

        // We check that the right texts are displayed at the right positions
        const text1 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-0")
        const text2 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-1")
        expect(text1).toHaveTextContent("dummy text 1")
        expect(text1).toHaveStyle({
          top: "0%",
          left: "0%",
        })
        expect(text2).toHaveTextContent("dummy text 2")
        expect(text2).toHaveStyle({
          top: "100%",
          left: "100%",
        })

        // We check that the right description is displayed
        expect(
          screen.getByTestId("meme-description-dummy_meme_id_1")
        ).toHaveTextContent("dummy meme 1")

        // We check that the right number of comments is displayed
        expect(
          screen.getByTestId("meme-comments-count-dummy_meme_id_1")
        ).toHaveTextContent("3 comments")
      })

      // Click comment button
      act(() => {
        fireEvent.click(
          screen.getByTestId("meme-comments-section-dummy_meme_id_1")
        )
      })

      const commentInput = screen.getByTestId(
        "meme-comments-input-dummy_meme_id_1"
      )

      const commentSubmit = screen.getByTestId(
        "meme-comments-submit-dummy_meme_id_1"
      )

      await waitFor(() => {
        expect(commentInput).toBeTruthy()
        expect(commentSubmit).toBeTruthy()
      })

      userEvent.type(commentInput, "hello{enter}")

      await waitFor(() => {
        expect(commentInput).toHaveValue("hello")
      })

      fireEvent.click(commentSubmit)

      // should test below if mutation is correctly triggered

      await waitFor(() => {
        // We check that the right comments with the right authors are displayed
        expect(
          screen.getByTestId(
            "meme-comment-content-dummy_meme_id_1-dummy_comment_id_1"
          )
        ).toHaveTextContent("dummy comment 1")
        expect(
          screen.getByTestId(
            "meme-comment-author-dummy_meme_id_1-dummy_comment_id_1"
          )
        ).toHaveTextContent("dummy_user_1")

        expect(
          screen.getByTestId(
            "meme-comment-content-dummy_meme_id_1-dummy_comment_id_2"
          )
        ).toHaveTextContent("dummy comment 2")
        expect(
          screen.getByTestId(
            "meme-comment-author-dummy_meme_id_1-dummy_comment_id_2"
          )
        ).toHaveTextContent("dummy_user_2")

        expect(
          screen.getByTestId(
            "meme-comment-content-dummy_meme_id_1-dummy_comment_id_3"
          )
        ).toHaveTextContent("dummy comment 3")
        expect(
          screen.getByTestId(
            "meme-comment-author-dummy_meme_id_1-dummy_comment_id_3"
          )
        ).toHaveTextContent("dummy_user_3")
      })
    })
  })
})
