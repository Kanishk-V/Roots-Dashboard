import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          boxShadow: 'sm',
          borderRadius: 'lg',
        },
      },
    },
  },
}); 