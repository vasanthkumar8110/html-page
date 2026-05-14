#import "LegacyCloudClient.h"

@implementation LegacyCloudClient

+ (instancetype)sharedClient {
    static LegacyCloudClient *sharedClient = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedClient = [[self alloc] init];
        sharedClient.baseUrl = @"http://localhost:3000/api/v1";
    });
    return sharedClient;
}

- (void)loginWithEmail:(NSString *)email 
             password:(NSString *)password 
           completion:(void (^)(BOOL success, NSError *error))completion {
    
    NSURL *url = [NSURL URLWithString:[NSString stringWithFormat:@"%@/auth/login", self.baseUrl]];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    [request setHTTPMethod:@"POST"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    
    NSDictionary *body = @{@"email": email, @"password": password};
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:body options:0 error:nil];
    [request setHTTPBody:jsonData];
    
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(NO, error);
            });
            return;
        }
        
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        self.accessToken = json[@"accessToken"];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            completion(YES, nil);
        });
    }];
    [task resume];
}

- (void)listFilesWithFolderId:(NSString *)folderId 
                 completion:(void (^)(NSArray *files, NSArray *folders, NSError *error))completion {
    
    NSString *urlPath = [NSString stringWithFormat:@"%@/files/list/%@", self.baseUrl, folderId ?: @""];
    NSURL *url = [NSURL URLWithString:urlPath];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    [request setHTTPMethod:@"GET"];
    [request setValue:[NSString stringWithFormat:@"Bearer %@", self.accessToken] forHTTPHeaderField:@"Authorization"];
    
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(nil, nil, error);
            });
            return;
        }
        
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        dispatch_async(dispatch_get_main_queue(), ^{
            completion(json[@"files"], json[@"folders"], nil);
        });
    }];
    [task resume];
}

- (void)downloadFileWithUrl:(NSString *)url 
                 toPath:(NSString *)path 
               progress:(void (^)(double progress))progress 
             completion:(void (^)(BOOL success, NSError *error))completion {
    
    NSURL *downloadUrl = [NSURL URLWithString:url];
    NSURLSessionDownloadTask *task = [[NSURLSession sharedSession] downloadTaskWithURL:downloadUrl completionHandler:^(NSURL *location, NSURLResponse *response, NSError *error) {
        if (error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(NO, error);
            });
            return;
        }
        
        NSError *moveError = nil;
        [[NSFileManager defaultManager] moveItemAtURL:location toURL:[NSURL fileURLWithPath:path] error:&moveError];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            completion(moveError == nil, moveError);
        });
    }];
    [task resume];
}

@end
