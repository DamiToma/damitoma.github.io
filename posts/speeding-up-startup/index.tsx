import React from 'react';
import type { Post } from '../index';
import SVGLink from './../SVGLink';
import H2 from './../components/H2';
import H3 from './../components/H3';
import Paragraph from './../components/Paragraph';

const meta = {
  slug: 'speeding-up-startup',
  title: 'How We Reduced Node.js Service Startup Time by 96%',
  date: '2025-09-14',
  lastUpdated: '2025-09-14',
  image: '/images/posts/0.jpg',
  preview: 'How we optimized our Node.js service to reduce startup time from 410s to 16s with simple data structure changes.',
  author: 'Damiano',
  tagline: 'How we optimized our Node.js service to reduce startup time from 410s to 16s with simple data structure changes.',
};


const Content = () => (
  <>
    <H2>Premise</H2>
    <Paragraph>
      Much of this may sound obvious, but I promise it isn't so clear when put into context. I run a fairly large trading bot platform with hundreds of thousands of lines of code and dozens of components, the vast majority of which I develop and maintain myself. As a result, it's easy to lose sight of the low-hanging fruit for improving performance. Another important note: the final setup is not what a unicorn company would run. We're a small company and need to focus on what brings real value. We could achieve everything I'm about to describe in a much more elegant fashion, but it's not worth the time investment.
    </Paragraph>
    <H2>Context</H2>
    <Paragraph>
      We provide liquidation bots, which allow users to trade against other traders' positions as they are liquidated. This combines liquidation data with the current Volume Weighted Moving Average (VWMA) of a given trading instrument to create signals. Because we support about 7,000 instruments and allow VWMAs based on up to 30 hours of candle data, the Liquidation Server (the component that handles all of this) needs to load around 12.6 million one-minute candles from the Trading Data API (the component that stores and provides APIs on top of candle data for the entire platform). On disk, one candle is 24 bytes of data, translating to roughly 300MB of data coming in on each Liquidation Server restart. No, the candles are not cached locally, and I won't bother to explain why.
    </Paragraph>
    <H2>More Context: Memory Constraints</H2>
    <Paragraph>
      To be honest, we're on a tight budget, so we need to run all our services as cheaply as possible. The Liquidation Server holds those 12.6 million candles in memory on a meager 2GB of RAM. My first approach was to keep a list of candles for each instrument, but this has a problem. Node's V8 memory allocator is not trivial, but for large arrays of objects it works more or less like this: each object has a 24-byte header, plus an 8-byte pointer to each property (in our case, numbers) and the field value. For an OHLCV candle, this equates to 128 bytes per candle, which is about 5x the disk footprint and adds up to 1.5GB of memory just to handle the candles. We can't afford this, so I decided to store the values in a data structure which ChatGPT calls a "Struct of Arrays." Essentially, we have an array for all the timestamps, one for all the open values, one for all the high values, and so on. This way, we have a 2-byte header for each array and 8 bytes for each number stored in it. The array header is amortized, so each candle ends up using roughly 48 bytes and we can thrive on budget-level machines.
    </Paragraph>
    <H2>Problem</H2>
    <Paragraph>
      When the Liquidation Server is started, it needs to pull the 12.6 million candles from the Trading Data API through HTTP calls. I noticed this would take 410 seconds to accomplish, and realized we could not afford that much downtime. So I took a flamegraph of the process and started digging into it.
    </Paragraph>
    <SVGLink href="/posts/speeding-up-startup/v0.svg" text="Original Flamegraph SVG" />
    <H3>1st Change: O(1) Lookups for Existing Candles Instead of O(N)</H3>
    <Paragraph>
      I was expecting to find a lot of network overhead, but what actually accounted for more than 60% of the samples were the calls to <code>pushCandle</code>. Explanation: each instrument loaded an array of candles, which needed to be pushed into the local list of candles. Sometimes, candle data coming from the Trading Data API is not perfect and includes duplicates, so we need to ensure no duplicates end up in the local copy of the candles. What I used (for each candle!) was to check whether the <code>openTime</code> list already had the current timestamp using <code>findIndex</code>. The problem: <code>findIndex</code> is O(N), and because the API assures us that candles will be sorted, it'll go all the way to the end of the array each time, for absolutely no reason. The first low-hanging fruit: just check the last element of the <code>openTime</code> array and see if the timestamp exists already. Please remember the premise and don't judge.
    </Paragraph>
    <Paragraph>
      <b>Result (Flamegraph)</b>: <code>pushCandle</code> (the part that called <code>findIndex</code>) now only accounts for 4% of the samples.<br />
      <b>Result (Time)</b>: Startup time is down from 410s to 80s. That's about an 80% improvement!
    </Paragraph>
    <SVGLink href="/posts/speeding-up-startup/v1.svg" text="v1 Flamegraph" />
    <H3>2nd Change: Set of Pairs Instead of Array of Pairs</H3>
    <Paragraph>
      The list of pairs was stored in an array, and I would check whether a pair received from the API actually existed (again, not going to bother explaining why it wouldn't) by doing <code>this.pairs.indexOf(pair) !== -1</code>. This is wasteful—it's an O(N) (average) lookup once again. We can just use a Set and accomplish the same thing, with a slightly increased memory footprint, but nothing significant. Note that the call to <code>Builtins_ArrayIndexOfSmiOrObject</code> consumes 2% of the samples. Not a huge improvement, but why waste CPU cycles?
    </Paragraph>
    <Paragraph>
      <b>Result (Flamegraph)</b>: <code>Builtins_ArrayIndexOfSmiOrObject</code> basically disappeared. We went from a sample frequency of 1.98% for <code>Builtins_ArrayIndexOfSmiOrObject</code> to 0.19% for <code>Builtins_FindOrderedHashSetEntry</code>.<br />
      <b>Result (Time)</b>: 74.030s. I was expecting an improvement of roughly 2%, but remember there's always some variability in the results.
    </Paragraph>
    <SVGLink href="/posts/speeding-up-startup/v2.svg" text="v2 Flamegraph" />
    <H3>3rd Change: Binary Serialization and Buffer Handling</H3>
    <div className="mb-4">
      Looking at the flamegraph, one element stood out: the samples for <code>transformData</code>, which is the part of axios that takes a response and serializes it to the expected format as defined in the Content-Type header. In our case, JSON. I'm a big fan of JSON, but I've grown more and more skeptical about it over the years. We're talking about two server components exchanging data—why does it need to be in human-readable format? The Trading Data API stores the candles in binary format. Currently, the steps are:
      <ul className="list-disc pl-6">
        <li>[Trading Data] Load up the candles from disk</li>
        <li>[Trading Data] Serialize them to JSON and prepare the response</li>
        <li>[Trading Data] The HTTP server serializes it back to binary to send candles over the wire</li>
        <li>[Liquidation Server] Read the binary response from the network socket</li>
        <li>[Liquidation Server] Serialize back to JSON</li>
        <li>[Liquidation Server] Unpack each field (OHLCV) from each candle, append it to the Struct of Arrays</li>
      </ul>
      <br />
      There are two problems here:
      <ul className="list-disc pl-6">
        <li>Time spent on serialization is absolutely unnecessary. As said, this is about two server components talking to each other; we should not exchange data in human-readable format. We're wasting time both on the Trading Data API and on the Liquidation Server.</li>
        <li>We're inflating ~300MB of binary data to around a GB, i.e., the footprint of the JSON responses. Aside from the additional time it takes to transfer more data over the wire, we're also filling up Node's process with memory that will need to be freed by the Garbage Collector, whose run time is anything but negligible.</li>
      </ul>
      <br />
      <div className="mb-6">
        So, let's change this and return the candles in binary format directly! Testing the new binary endpoint with cURL shows the response size shrinks by about 72%. Not bad!
      </div>
      <Paragraph>
      Let's also update the logic for <code>pushCandle</code>. Because we're now receiving buffer data, I instinctively immediately converted it to the SoA structure and saved it without going through <code>pushCandle</code>. This was a mistake: as I mentioned, another component is pushing real-time candles here. What might happen is we start the process while approaching the end of the current minute, and some pairs receive the latest real-time candle before they have a chance to initialize. If we were to just save the list of candles without ensuring the resulting timeseries is sorted and purged of duplicates, we might end up with invalid data. So I had to rewrite <code>pushCandle</code> in order to buffer the real time candles and then merge them into the existing timeseries once the initial load is complete. It also makes the first and second change pretty much useless, as we will no longer call <code>pushCandle</code> for the candles from the API.
      </Paragraph>
      Doing this in one step was a mistake because I cannot measure the direct impact of buffers over JSON and O(logN) insertions, but oh well.
    </div>
    <Paragraph>
      <b>Result (Flamegraphs)</b>: <br />
      <b>Result (Time)</b>: 21.108s. An astounding 96.9% improvement compared to the initial times!
    </Paragraph>
    <SVGLink href="/posts/speeding-up-startup/v3.svg" text="v3 Flamegraph" />
    <H2>Conclusion & Future Work</H2>
    <Paragraph>
      We improved the startup time of our Liquidation Server from 410s to 21s, a 96.9% improvement, by making three changes:
    </Paragraph>
    <ul className="list-disc pl-6 mb-4">
        <li>Changing O(N) lookups to O(1) lookups when checking for existing candles</li>
        <li>Returning candles in binary format instead of JSON</li>
        <li>Improving other aspects of the architecture</li>
    </ul>
    <Paragraph>The next, most obvious step is to cache the candles to file (or Redis) to avoid loading from API each time the process is restarted. Right now, I'm satisfied with the progress and will move on to the next challenge.</Paragraph>
    <Paragraph>
        Until next time!
    </Paragraph>
  </>
);

const post: Post = {
  meta,
  Content,
};

export default post;
