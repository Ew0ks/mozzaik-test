import { Avatar, Box, Flex, Input, useQuery } from "@chakra-ui/react"
import { GetMemesResponse, getUserById } from "../api"
import { jwtDecode } from "jwt-decode"
import { useAuthToken } from "../contexts/authentication"

export type MemeCommentContentProps = {
  commentContent: { [key: string]: string }
  meme?: GetMemesResponse
  mutate: (mutations: {
    memeId: number
    content: { [key: string]: string | number }
  }) => void
  setCommentContent?: (
    updatedContent: { memeId: number; content: string | number }[]
  ) => void
}

export const MemeCommentForm: React.FC<MemeCommentContentProps> = ({
  commentContent,
  meme,
  mutate,
  setCommentContent = () => {},
}) => {
  const token = useAuthToken()

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return await getUserById(token, jwtDecode<{ id: string }>(token).id)
    },
  })

  return (
    <Box mb={6}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (commentContent[meme.id]) {
            mutate({
              memeId: meme.id,
              content: commentContent[meme.id],
            })
          }
        }}
      >
        <Flex alignItems="center">
          <Avatar
            borderWidth="1px"
            borderColor="gray.300"
            name={user?.username}
            src={user?.pictureUrl}
            size="sm"
            mr={2}
          />
          <Input
            placeholder="Type your comment here..."
            onChange={(event) => {
              setCommentContent({
                ...commentContent,
                [meme.id]: event.target.value,
              })
            }}
            value={commentContent[meme.id] || ""}
          />
        </Flex>
      </form>
    </Box>
  )
}
