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
import { useCallback, useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { isEmpty, isNotEmpty } from "ramda"
import { Comment } from "../../components/comment"
import { Meme } from "../../components/meme"

export const MemeFeedPage: React.FC = () => {
  const token = useAuthToken()
  const [openedCommentSection, setOpenedCommentSection] = useState<string>("")
  const [commentContent, setCommentContent] = useState<{
    [key: string]: string
  }>({})

  const { mutate } = useMutation({
    mutationFn: async (data: { memeId: string; content: string }) =>
      await createMemeComment(token, data.memeId, data.content),
    onSuccess: () => {
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

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return await getUserById(token, jwtDecode<{ id: string }>(token).id)
    },
  })

  const handleScroll = useCallback(() => {
    const container = document.getElementById("container")

    if (!container) return

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
                <Meme meme={meme} />
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
                        return <Comment comment={comment} memeId={meme.id} />
                      })
                    })}

                    {isFetchingComments && (
                      <Loader data-testid="meme-comments-loader" />
                    )}
                  </VStack>
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
