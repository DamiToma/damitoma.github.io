import React from "react";
import { posts } from "../../posts";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Head from "next/head";

import { PostMeta } from '../../posts';

interface BlogPostPageProps {
  meta: PostMeta;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ meta }) => {
  // Find the post by slug at runtime to get the Content function
  const post = posts.find((p) => p.meta.slug === meta.slug);
  if (!post) return <div>Post not found.</div>;
  const { Content } = post;
  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.preview} />
      </Head>
      <div className={`container mx-auto mt-10`}>
        <Header isBlog={true} />
        <div className="mt-10 flex flex-col">
          {meta.image && (
            <img
              className="w-full h-96 rounded-lg shadow-lg object-cover"
              src={meta.image}
              alt={meta.title}
            />
          )}
        </div>
      </div>
      <div className="mt-10 px-64 sm:px-6 md:px-8 lg:px-16 xl:px-24 2xl:px-40 max-w-7xl mx-auto">
        <div>
          <h1 className="mt-10 text-2xl mob:text-xl laptop:text-4xl font-bold">{meta.title}</h1>
          {meta.tagline && (
            <h2 className="mt-2 text-md max-w-4xl text-darkgray opacity-50">{meta.tagline}</h2>
          )}
          {meta.lastUpdated && (
            <h3 className="mt-2 text-md max-w-3xl text-darkgray opacity-50">Last Updated: {meta.lastUpdated}</h3>
          )}
        </div>
        <Content />
      </div>
      <Footer />
    </>
  );
};

import { GetStaticPaths, GetStaticProps } from 'next';

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: posts.map((post) => ({ params: { slug: post.meta.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = posts.find((p) => p.meta.slug === params?.slug);
  if (!post) return { notFound: true };
  return { props: { meta: post.meta } };
};

export default BlogPostPage;