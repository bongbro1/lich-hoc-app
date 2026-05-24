import { UserProfileModel } from 'models/user';

export interface ProfileFeedScreenProps {
  route: {
    params: {
      studentId: string;
    };
  };
  navigation: any;
}