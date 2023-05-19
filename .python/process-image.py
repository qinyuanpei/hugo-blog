import io, os, sys
import tinify

def compress_file(file_path, file_size_limit):
    """
    压缩单个文件，如果文件大小超过限制则进行压缩，否则跳过
    """
    file_size = os.path.getsize(file_path)
    if file_size > file_size_limit:
        print(f"Prepare to compress file: {file_path}")
        try:
            source = tinify.from_file(file_path)
            source.to_file(file_path)
            new_file_size = os.path.getsize(file_path)
            print(f"The file {file_path} is compressed successful, {file_size} -> {new_file_size}")
        except tinify.errors.AccountError:
            print("Compression failed: API key is invalid.")
        except tinify.errors.ConnectionError:
            print("Compression failed: network connection error.")
        except Exception as e:
            print("Compression failed:", e)
    else:
        print("Skipping file:", file_path)

def compress_folder(folder_path, file_size_limit=1024 * 1024 * 0.5):
    """
    递归压缩文件夹中的所有图片文件
    """
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            root = os.path.abspath(root)
            file_path = os.path.join(root, file)
            if file_path.endswith((".jpg", ".jpeg", ".png")):
                compress_file(file_path, file_size_limit)

if __name__ == "__main__":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')
    if len(sys.argv) < 3:
        print('A TinyPNG API KEY or folder_path of images are required!')
    else:
        tinify.key = sys.argv[1]
        folder_path = sys.argv[2]
        compress_folder(folder_path)