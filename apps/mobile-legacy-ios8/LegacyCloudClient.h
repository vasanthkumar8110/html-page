#import <Foundation/Foundation.h>

@interface LegacyCloudClient : NSObject

@property (nonatomic, strong) NSString *baseUrl;
@property (nonatomic, strong) NSString *accessToken;

+ (instancetype)sharedClient;

- (void)loginWithEmail:(NSString *)email 
             password:(NSString *)password 
           completion:(void (^)(BOOL success, NSError *error))completion;

- (void)listFilesWithFolderId:(NSString *)folderId 
                 completion:(void (^)(NSArray *files, NSArray *folders, NSError *error))completion;

- (void)downloadFileWithUrl:(NSString *)url 
                 toPath:(NSString *)path 
               progress:(void (^)(double progress))progress 
             completion:(void (^)(BOOL success, NSError *error))completion;

@end
