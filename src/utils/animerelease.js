import axios from "axios";
export default async (sw, ew, page = 1) => {
  try {
    const query = `
          query (
           $weekStart: Int,
               $weekEnd: Int,
                   $page: Int
       ){
                       Page(page: $page) {
                               pageInfo {
                                           hasNextPage
                                                       total
       }
                                                               airingSchedules(
                                                                           airingAt_greater: $weekStart
                                                                                       airingAt_lesser: $weekEnd
       ) {
                                                                                                   id
                                                                                                               episode
                                                                                                                           airingAt
                                                                                                                                       media {
                                                                                                                                                       id
                                                                                                                                                                       idMal
                                                                                                                                                                                       title {
                                                                                                                                                                                                           romaji
                                                                                                                                                                                                                               native
                                                                                                                                                                                                                                                   english
       }
                                                                                                                                                                                                                                                                   startDate {
                                                                                                                                                                                                                                                                                       year
                                                                                                                                                                                                                                                                                                           month
                                                                                                                                                                                                                                                                                                                               day
       }
                                                                                                                                                                                                                                                                                                                                               endDate {
                                                                                                                                                                                                                                                                                                                                                                   year
                                                                                                                                                                                                                                                                                                                                                                                       month
                                                                                                                                                                                                                                                                                                                                                                                                           day
       }
                                                                                                                                                                                                                                                                                                                                                                                                                           status
                                                                                                                                                                                                                                                                                                                                                                                                                                           season
                                                                                                                                                                                                                                                                                                                                                                                                                                                           format
                                                                                                                                                                                                                                                                                                                                                                                                                                                                           genres
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           synonyms
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           duration
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           popularity
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           episodes
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           source(version: 2)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           countryOfOrigin
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           hashtag
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           averageScore
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           siteUrl
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           description
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           bannerImage
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           isAdult
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           coverImage {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               extraLarge
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   color
       }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   trailer {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           site
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               thumbnail
       }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               externalLinks {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   site
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       icon
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           color
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               url
       }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               rankings {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   rank
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       type
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           season
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               allTime
       }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               studios(isMain: true) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   nodes {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   name
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           siteUrl
       }
       }
                       relations {
                                           edges {
                                                                   relationType(version: 2)
                                                                                           node {
                                                                                                                       id
                                                                                                                                                   title {
                                                                                                                                                                                   romaji
                                                                                                                                                                                                                   native
                                                                                                                                                                                                                                                   english
       }
                                                                                                                                                                                                                                                                               siteUrl
       }
       }
       }
       }
       }
       }
       }`;
    function getStartAndEndOfWeekWithOffset() {
      // Get the current date
      const now = new Date();

      // Get the current day of the week (0-6, Sunday-Saturday)
      const dayOfWeek = now.getDay();

      // Calculate the start of the week (Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0); // Set to midnight at the start of the day

      // Calculate the end of the week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999); // Set to the end of the day

      const offsetMillis = 0; //42 * 60 * 60 * 1000 + 30 * 60 * 1000; // 42 hours 30 minutes in milliseconds
      startOfWeek.setTime(startOfWeek.getTime() + offsetMillis);
      endOfWeek.setTime(endOfWeek.getTime() + offsetMillis);

      return {
        startOfWeek: Math.floor(startOfWeek.getTime() / 1000), // Convert to Unix timestamp
        endOfWeek: Math.floor(endOfWeek.getTime() / 1000) + 1, // Convert to Unix timestamp
      };
    }

    const now = new Date();
    const { startOfWeek, endOfWeek } = getStartAndEndOfWeekWithOffset(now);

    const variables = {
      weekStart: sw ?? startOfWeek,
      weekEnd: ew ?? endOfWeek,
      page: page ?? 1,
    };
    let { data } = await axios.post("https://graphql.anilist.co", {
      query,
      variables,
    });
    data = data.data.Page.airingSchedules;
    return data;
  } catch (error) {
    throw Error(error);
  }
};
