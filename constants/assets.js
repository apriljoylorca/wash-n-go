// Centralized asset management
export const Images = {
    // Carousel Images
    carousel: [
      require('../assets/images/carousel1.jpg'),
      require('../assets/images/carousel2.jpg'),
      require('../assets/images/carousel3.jpg'),
      require('../assets/images/carousel4.jpg'),
      require('../assets/images/carousel5.jpg'),
    ],
  
    // Other Images
    logo: require('../assets/images/logo.png'),
    driverProfile: require('../assets/images/driver-profile.png'),
    laundrySample: require('../assets/images/laundry-sample.jpg'),
  };
  
  // Image dimensions for optimization
  export const ImageDimensions = {
    logo: {
      width: 120,
      height: 120,
    },
    carousel: {
      width: '100%',
      aspectRatio: 16 / 9,
    },
  };
  