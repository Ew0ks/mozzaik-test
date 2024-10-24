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
} from "@chakra-ui/react"
import { CaretDown, CaretUp, Chat } from "@phosphor-icons/react"
import { format } from "timeago.js"
import {
  createMemeComment,
  getMemeComments,
  GetMemeCommentsResponse,
  getMemes,
  GetMemesResponse,
  getUserById,
  GetUserByIdResponse,
} from "../../api"
import { useAuthToken } from "../../contexts/authentication"
import { Loader } from "../../components/loader"
import { MemePicture } from "../../components/meme-picture"
import { useCallback, useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"

export const MemeFeedPage: React.FC = () => {
  const token = useAuthToken()
  const [page, setPage] = useState<number>(1)
  const [openedCommentSection, setOpenedCommentSection] = useState<
    string | null
  >(null)
  const [commentContent, setCommentContent] = useState<{
    [key: string]: string
  }>({})

  const { mutate } = useMutation({
    mutationFn: async (data: { memeId: string; content: string }) => {
      await createMemeComment(token, data.memeId, data.content)
    },
  })

  const { isFetching, data, fetchNextPage } = useInfiniteQuery({
    queryKey: ["memes"],
    refetchOnWindowFocus: false,
    initialPageParam: 1,
    getNextPageParam: () => {
      return page + 1
    },
    queryFn: async () => {
      console.log(page, "page")
      const fetchedMemesList = await getMemes(token, page)
      const rawMemesList = fetchedMemesList.results

      const list = await Promise.all(
        rawMemesList.map(async (rawMeme) => {
          const author = await getUserById(token, rawMeme.authorId)
          return { ...rawMeme, author }
        })
      )

      setPage((previousPage) => previousPage + 1)

      return {
        list,
        page,
        size: fetchedMemesList.pageSize,
        total: fetchedMemesList.total,
      }

      /*       const remainingPages =
        Math.ceil(firstPage.total / firstPage.pageSize) - 1;
      for (let i = 0; i < remainingPages; i++) {
        const page = await getMemes(token, i + 2);
        memes.push(...page.results);
      }
      const memesWithAuthorAndComments = [];
      for (let meme of memes) {
        const author = await getUserById(token, meme.authorId);
        const comments: GetMemeCommentsResponse["results"] = [];
        const firstPage = await getMemeComments(token, meme.id, 1);
        comments.push(...firstPage.results);
        const remainingCommentPages =
          Math.ceil(firstPage.total / firstPage.pageSize) - 1;
        for (let i = 0; i < remainingCommentPages; i++) {
          const page = await getMemeComments(token, meme.id, i + 2);
          comments.push(...page.results);
        }
        const commentsWithAuthor: (GetMemeCommentsResponse["results"][0] & {
          author: GetUserByIdResponse;
        })[] = [];
        for (let comment of comments) {
          const author = await getUserById(token, comment.authorId);
          commentsWithAuthor.push({ ...comment, author });
        }
        memesWithAuthorAndComments.push({
          ...meme,
          author,
          comments: commentsWithAuthor,
        });
      }
      return memesWithAuthorAndComments; */
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

    // Utilisation d'une petite tolérance pour la comparaison
    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 2
    ) {
      fetchNextPage()
    }
  }, [])

  useEffect(() => {
    const container = document.getElementById("container")
    if (!container) return
    if (isFetching) {
      container.removeEventListener("scroll", handleScroll)
    } else {
      container.addEventListener("scroll", handleScroll)
    }

    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll, isFetching])

  useEffect(
    () => console.log(openedCommentSection, "openedCommentSection"),
    [openedCommentSection]
  )
  useEffect(() => console.log(data, "data"), [data])

  console.log(isFetching, "isFetching")

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
        {data?.pages.map((pages) => {
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
                            openedCommentSection === meme.id ? null : meme.id
                          )
                        }
                      >
                        <Text data-testid={`meme-comments-count-${meme.id}`}>
                          {meme.commentsCount} comments
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
                          value={commentContent[meme.id]}
                        />
                      </Flex>
                    </form>
                  </Box>
                  {/*<VStack align="stretch" spacing={4}>
                    {meme.comments.map((comment) => (
                      <Flex key={comment.id}>
                        <Avatar
                          borderWidth="1px"
                          borderColor="gray.300"
                          size="sm"
                          name={comment.author.username}
                          src={comment.author.pictureUrl}
                          mr={2}
                        />
                        <Box p={2} borderRadius={8} bg="gray.50" flexGrow={1}>
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
                    ))}
                  </VStack> */}
                </Collapse>
              </VStack>
            )
          })
        })}
        {isFetching && <Loader data-testid="meme-feed-loader" />}
      </VStack>
    </Flex>
  )
}

export const Route = createFileRoute("/_authentication/")({
  component: MemeFeedPage,
})
