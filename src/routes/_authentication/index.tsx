import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Avatar,
  Box,
  Collapse,
  Flex,
  Icon,
  LinkBox,
  LinkOverlay,
  StackDivider,
  Text,
  Input,
  VStack,
  Button,
} from "@chakra-ui/react"
import { CaretDown, CaretUp, Chat } from "@phosphor-icons/react"
import { format } from "timeago.js"
import {
  createMemeComment,
  getMemeComments,
  GetMemeCommentsResponse,
  getMemes,
  GetMemesResponseWithAuthor,
  getUserById,
} from "../../api"
import { useAuthToken } from "../../contexts/authentication"
import { Loader } from "../../components/loader"
import { MemePicture } from "../../components/meme-picture"
import { useCallback, useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { isEmpty, isNotEmpty } from "ramda"

export const MemeFeedPage: React.FC = () => {
  const token = useAuthToken()
  const [openedCommentSection, setOpenedCommentSection] = useState<string>("")
  const [commentContent, setCommentContent] = useState<{
    [key: string]: string
  }>({})

  const { mutate } = useMutation({
    mutationFn: async (data: { memeId: string; content: string }) =>
      await createMemeComment(token, data.memeId, data.content),
    onSuccess: (data) => {
      console.log(data, "data success")
      setCommentContent({})
      refetch()
    },
  })

  const {
    isFetching: isFetchingMemeFeed,
    data: memeFeed,
    fetchNextPage: fetchNextFeedMemePage,
  } = useInfiniteQuery({
    queryKey: ["memes"],
    refetchOnWindowFocus: false,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetMemesResponseWithAuthor) => {
      if (isEmpty(lastPage.list)) {
        return undefined
      }
      return lastPage.page + 1
    },
    queryFn: async ({ pageParam }): Promise<GetMemesResponseWithAuthor> => {
      console.log(pageParam, "pageParam")
      const fetchedMemesList = await getMemes(token, Number(pageParam))
      const rawMemesList = fetchedMemesList.results

      const list = await Promise.all(
        rawMemesList.map(async (rawMeme) => {
          const author = await getUserById(token, rawMeme.authorId)
          return { ...rawMeme, author }
        })
      )

      return {
        list,
        page: pageParam,
        size: fetchedMemesList.pageSize,
        total: fetchedMemesList.total,
      }
    },
  })

  const {
    isFetching: isFetchingComments,
    data: comments,
    refetch,
    fetchNextPage: fetchNextCommentsPage,
    hasNextPage: hasNextCommentsPage,
  } = useInfiniteQuery({
    queryKey: ["comments", openedCommentSection],
    refetchOnWindowFocus: false,
    enabled: isNotEmpty(openedCommentSection),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetMemeCommentsResponse) => {
      if (isEmpty(lastPage.results) || isEmpty(openedCommentSection)) {
        return undefined
      }
      return lastPage.page + 1
    },
    queryFn: async ({ pageParam }): Promise<GetMemeCommentsResponse> => {
      const fetchedMemesList = await getMemeComments(
        token,
        openedCommentSection,
        Number(pageParam)
      )
      const rawCommentsList = fetchedMemesList.results

      const results = await Promise.all(
        rawCommentsList.map(async (rawComment) => {
          const author = await getUserById(token, rawComment.authorId)
          return { ...rawComment, author }
        })
      )

      return {
        results,
        page: pageParam,
        pageSize: fetchedMemesList.pageSize,
        total: fetchedMemesList.total,
      }
    },
  })

  useEffect(() => {
    console.log(isNotEmpty(openedCommentSection))
    console.log(openedCommentSection, "openedCommentSection")
    console.log(comments, "comments")
  }, [openedCommentSection, comments])

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return await getUserById(token, jwtDecode<{ id: string }>(token).id)
    },
  })

  const handleScroll = useCallback(() => {
    const container = document.getElementById("container")

    if (!container) return

    // Utilisation d'une petite tolérance pour la comparaison
    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 2
    ) {
      fetchNextFeedMemePage()
    }
  }, [])

  useEffect(() => {
    const container = document.getElementById("container")
    if (!container) return
    if (isFetchingMemeFeed) {
      container.removeEventListener("scroll", handleScroll)
    } else {
      container.addEventListener("scroll", handleScroll)
    }

    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll, isFetchingMemeFeed])

  useEffect(
    () => console.log(hasNextCommentsPage, "hasNextCommentsPage"),
    [hasNextCommentsPage]
  )

  return (
    <Flex
      width="full"
      height="full"
      justifyContent="center"
      overflowY="auto"
      id="container"
    >
      <VStack
        p={4}
        width="full"
        maxWidth={800}
        divider={<StackDivider border="gray.200" />}
      >
        {memeFeed?.pages.map((pages) => {
          return pages.list.map((meme) => {
            return (
              <VStack key={meme.id} p={4} width="full" align="stretch">
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
                  <Box
                    p={2}
                    borderRadius={8}
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Text
                      color="gray.500"
                      whiteSpace="pre-line"
                      data-testid={`meme-description-${meme.id}`}
                    >
                      {meme.description}
                    </Text>
                  </Box>
                </Box>
                <LinkBox as={Box} py={2} borderBottom="1px solid black">
                  <Flex justifyContent="space-between" alignItems="center">
                    <Flex alignItems="center">
                      <LinkOverlay
                        data-testid={`meme-comments-section-${meme.id}`}
                        cursor="pointer"
                        onClick={() =>
                          setOpenedCommentSection(
                            openedCommentSection === meme.id ? "" : meme.id
                          )
                        }
                      >
                        <Text data-testid={`meme-comments-count-${meme.id}`}>
                          {`${meme.commentsCount} comment${parseInt(meme.commentsCount) > 1 ? "s" : ""}`}
                        </Text>
                      </LinkOverlay>
                      <Icon
                        as={
                          openedCommentSection !== meme.id ? CaretDown : CaretUp
                        }
                        ml={2}
                        mt={1}
                      />
                    </Flex>
                    <Icon as={Chat} />
                  </Flex>
                </LinkBox>
                <Collapse in={openedCommentSection === meme.id} animateOpacity>
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
                  <VStack align="stretch" spacing={4}>
                    {comments?.pages.map((pages) => {
                      return pages.results.map((comment) => {
                        return (
                          <Flex key={comment.id}>
                            <Avatar
                              borderWidth="1px"
                              borderColor="gray.300"
                              size="sm"
                              name={comment.author.username}
                              src={comment.author.pictureUrl}
                              mr={2}
                            />
                            <Box
                              p={2}
                              borderRadius={8}
                              bg="gray.50"
                              flexGrow={1}
                            >
                              <Flex
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Flex>
                                  <Text
                                    data-testid={`meme-comment-author-${meme.id}-${comment.id}`}
                                  >
                                    {comment.author.username}
                                  </Text>
                                </Flex>
                                <Text
                                  fontStyle="italic"
                                  color="gray.500"
                                  fontSize="small"
                                >
                                  {format(comment.createdAt)}
                                </Text>
                              </Flex>
                              <Text
                                color="gray.500"
                                whiteSpace="pre-line"
                                data-testid={`meme-comment-content-${meme.id}-${comment.id}`}
                              >
                                {comment.content}
                              </Text>
                            </Box>
                          </Flex>
                        )
                      })
                    })}
                  </VStack>

                  {isFetchingComments && (
                    <Loader data-testid="meme-comments-loader" />
                  )}
                  {parseInt(meme.commentsCount) > 10 && hasNextCommentsPage && (
                    <Button
                      onClick={() => fetchNextCommentsPage()}
                      color="white"
                      colorScheme="cyan"
                      mt={4}
                      size="sm"
                      type="submit"
                      width="full"
                    >
                      Voir plus de commentaires
                    </Button>
                  )}
                </Collapse>
              </VStack>
            )
          })
        })}
        {isFetchingMemeFeed && <Loader data-testid="meme-feed-loader" />}
      </VStack>
    </Flex>
  )
}

export const Route = createFileRoute("/_authentication/")({
  component: MemeFeedPage,
})
