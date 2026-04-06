import React from 'react';
import { Still, Series, Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import { PortfolioSlide } from './components/PortfolioSlide';
import { SLIDES } from './slides/slideData';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

const { fontFamily } = loadFont();

const FontLoader: React.FC = () => (
  <style>{`* { box-sizing: border-box; font-family: ${fontFamily}, system-ui, sans-serif; }`}</style>
);

const VideoSequence: React.FC = () => (
  <>
    <FontLoader />
    <Series>
      {SLIDES.map((slide) => (
        <Series.Sequence key={slide.id} durationInFrames={90}>
          <PortfolioSlide slide={slide} />
        </Series.Sequence>
      ))}
    </Series>
  </>
);

const SlideWithFont: React.FC<{ slideId: number }> = ({ slideId }) => {
  const slide = SLIDES.find((s) => s.id === slideId);
  if (!slide) return null;
  return (
    <>
      <FontLoader />
      <PortfolioSlide slide={slide} />
    </>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    {SLIDES.map((slide) => (
      <Still
        key={slide.id}
        id={`Slide${String(slide.id).padStart(2, '0')}`}
        component={SlideWithFont}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        defaultProps={{ slideId: slide.id }}
      />
    ))}

    <Composition
      id="ConoscermiPortfolio"
      component={VideoSequence}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      fps={30}
      durationInFrames={SLIDES.length * 90}
      defaultProps={{}}
    />
  </>
);
