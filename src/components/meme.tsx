import { Avatar, Box, Flex, Text } from "@chakra-ui/react"
import { GetUserByIdResponse } from "../api"
import { format } from "timeago.js"
import { MemePicture } from "./meme-picture"

export type MemeProps = {
  meme: {
    id: string
    authorId: string
    pictureUrl: string
    description: string
    commentsCount: string
    texts: {
      content: string
      x: number
      y: number
    }[]
    createdAt: string
    author: GetUserByIdResponse
  }
}

export const Meme: React.FC<MemeProps> = ({ meme }) => {
  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Flex>
          <Avatar
            borderWidth="1px"
            borderColor="gray.300"
            size="xs"
            name={meme.author.username}
            src={meme.author.pictureUrl}
          />
          <Text ml={2} data-testid={`meme-author-${meme.id}`}>
            {meme.author.username}
          </Text>
        </Flex>
        <Text fontStyle="italic" color="gray.500" fontSize="small">
          {format(meme.createdAt)}
        </Text>
      </Flex>
      <MemePicture
        pictureUrl={meme.pictureUrl}
        texts={meme.texts}
        dataTestId={`meme-picture-${meme.id}`}
      />
      <Box>
        <Text fontWeight="bold" fontSize="medium" mb={2}>
          Description:{" "}
        </Text>
        <Box p={2} borderRadius={8} border="1px solid" borderColor="gray.100">
          <Text
            color="gray.500"
            whiteSpace="pre-line"
            data-testid={`meme-description-${meme.id}`}
          >
            {meme.description}
          </Text>
        </Box>
      </Box>
    </>
  )
}
