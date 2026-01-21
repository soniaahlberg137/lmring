import { createElement, forwardRef } from 'react';

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => children;

const createMotionComponent = (tag: string) =>
  forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode } & Record<string, unknown>,
      ref: React.Ref<unknown>,
    ) => {
      // Filter out framer-motion specific props
      const {
        onAnimationComplete,
        initial,
        animate,
        exit,
        variants,
        whileHover,
        whileTap,
        whileFocus,
        whileDrag,
        whileInView,
        transition,
        layout,
        layoutId,
        drag,
        dragConstraints,
        dragElastic,
        dragMomentum,
        dragTransition,
        onDragStart,
        onDragEnd,
        onDrag,
        ...domProps
      } = props;
      return createElement(tag, { ...domProps, ref }, children);
    },
  );

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
  button: createMotionComponent('button'),
  a: createMotionComponent('a'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
  p: createMotionComponent('p'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  section: createMotionComponent('section'),
  article: createMotionComponent('article'),
  header: createMotionComponent('header'),
  footer: createMotionComponent('footer'),
  nav: createMotionComponent('nav'),
  main: createMotionComponent('main'),
  aside: createMotionComponent('aside'),
  form: createMotionComponent('form'),
  input: createMotionComponent('input'),
  img: createMotionComponent('img'),
  svg: createMotionComponent('svg'),
  path: createMotionComponent('path'),
  // motion.create() for wrapping custom components
  create: (Component: React.ComponentType<Record<string, unknown>>) =>
    forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode } & Record<string, unknown>,
        ref: React.Ref<unknown>,
      ) => {
        // Filter out framer-motion specific props
        const {
          onAnimationComplete,
          initial,
          animate,
          exit,
          variants,
          whileHover,
          whileTap,
          whileFocus,
          whileDrag,
          whileInView,
          transition,
          layout,
          layoutId,
          drag,
          dragConstraints,
          dragElastic,
          dragMomentum,
          dragTransition,
          onDragStart,
          onDragEnd,
          onDrag,
          ...domProps
        } = props;
        return createElement(Component, { ...domProps, ref }, children);
      },
    ),
};

export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
});

export const useMotionValue = (initial: number) => ({
  get: () => initial,
  set: () => {},
  on: () => () => {},
  onChange: () => () => {},
});

export const useTransform = () => ({
  get: () => 0,
  set: () => {},
});

export const useSpring = () => ({
  get: () => 0,
  set: () => {},
});

export const useInView = () => true;

export const useScroll = () => ({
  scrollY: { get: () => 0 },
  scrollYProgress: { get: () => 0 },
  scrollX: { get: () => 0 },
  scrollXProgress: { get: () => 0 },
});

export const useReducedMotion = () => false;

export const MotionConfig = ({ children }: { children: React.ReactNode }) => children;

export const LazyMotion = ({ children }: { children: React.ReactNode }) => children;

export const domAnimation = {};
export const domMax = {};

export default {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useInView,
  useScroll,
  useReducedMotion,
  MotionConfig,
  LazyMotion,
  domAnimation,
  domMax,
};
